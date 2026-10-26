'use server';

import { ai } from '@/lib/gemini';
import { PDFParse } from 'pdf-parse';
import { chunkText } from '@/lib/chunking';
import { supabase } from '@/lib/supabase';
import { getFriendlyErrorMessage } from '@/lib/errorHandler';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const EMBEDDING_MODEL = 'gemini-embedding-001';
const STORAGE_BUCKET = 'documents';

export async function processAndStoreDocument(
  prevState: { success: boolean; message: string } | null,
  formData: FormData
) {
  let uploadedStoragePath: string | null = null;
  try {
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      return { success: false, message: 'No file provided.' };
    }
    if (file.size > MAX_FILE_SIZE) throw new Error('File size exceeds the 10MB limit.');

    // 1. Read file content based on its type (PDF or TXT) and extract raw text with parser
    let rawText = '';
    const arrayBuffer = await file.arrayBuffer();

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
      try {
        const result = await parser.getText();
        rawText = result.text;
      } finally {
        await parser.destroy();
      }
    } else if (file.type.startsWith('text/plain') || file.name.endsWith('.txt')) {
      rawText = Buffer.from(arrayBuffer).toString('utf-8');
    } else {
      throw new Error('Unsupported file format. Only .txt and .pdf files are supported.');
    }

    if (!rawText.trim()) throw new Error('File content is empty');

    // 2. upload file to supabase bucket
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(uniqueFileName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError || !storageData)
      throw new Error(`Failed to create document record: ${storageError?.message}`);
    uploadedStoragePath = storageData.path;

    // get document public url
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(uploadedStoragePath);
    const publicUrl = publicUrlData.publicUrl;

    // 3. write data into documents table
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        title: file.name,
        file_path: publicUrl,
        raw_text: rawText,
      })
      .select()
      .single();

    if (docError || !docData)
      throw new Error(`Failed to create document record: ${docError?.message}`);

    try {
      // 4. Chunking
      const chunks = chunkText(rawText, 500, 50);
      if (chunks.length === 0) throw new Error('No chunks were created from the document content.');

      // 5. Generate all embeddings first (to avoid partial inserts in case of an error)
      const rows = await Promise.all(
        chunks.map(async (chunk) => {
          // call Gemini embedding model to get embedding vector
          const embeddingResponse = await ai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: chunk.content,
            config: {
              outputDimensionality: 768, // must match the vector dimension (vector(768))
              taskType: 'RETRIEVAL_DOCUMENT', // specify the task type for document retrieval
            },
          });

          const embeddingVector = embeddingResponse.embeddings?.[0]?.values;
          if (!embeddingVector) throw new Error(`Embedding failed for chunk ${chunk.chunkIndex}`);

          // Prepare the row for insertion
          return {
            document_id: docData.id,
            content: chunk.content,
            embedding: JSON.stringify(embeddingVector), // Supabase expects a string for the embedding column
            metadata: { chunkIndex: chunk.chunkIndex, fileName: file.name },
          };
        })
      );

      // 6. Insert all chunks into `document_chunks` table
      const { error: chunkError } = await supabase.from('document_chunks').insert(rows);
      if (chunkError) throw new Error(`Failed to insert document chunks: ${chunkError.message}`);

      return {
        success: true,
        documentId: docData.id,
        chunkCount: chunks.length,
        message: 'Your file is successfully uploaded.',
      };
    } catch (error) {
      // rollback: remove the orphan document (chunks cascade-delete)
      await supabase.from('documents').delete().eq('id', docData.id);
      throw error;
    }
  } catch (error: unknown) {
    console.error('File Processing Error:', error);
    // if error occured before data insertion, remove the uploaded files
    if (uploadedStoragePath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([uploadedStoragePath]);
    }
    return {
      success: false,
      message: getFriendlyErrorMessage(error),
    };
  }
}
