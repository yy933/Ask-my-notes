'use server';

import { ai } from '@/lib/gemini';
import { PDFParse } from 'pdf-parse';
import { chunkText } from '@/lib/chunking';
import { supabase } from '@/lib/supabase';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function processAndStoreDocument(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided.');
    if (file.size > MAX_FILE_SIZE) throw new Error('File size exceeds the 10MB limit.');

    // 1. Read file content based on its type (PDF or TXT)
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

    // 2. add new data to `documents` table
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        title: file.name,
        file_path: null, // since we are not storing the file in Supabase Storage for now, we can set this to null
      })
      .select()
      .single();

    if (docError || !docData)
      throw new Error(`Failed to create document record: ${docError?.message}`);

    try {
      // 3. Chunking
      const chunks = chunkText(rawText, 500, 50);
      if (chunks.length === 0) throw new Error('No chunks were created from the document content.');

      // 4. Generate all embeddings first (to avoid partial inserts in case of an error)
      const rows = [];
      for (const chunk of chunks) {
        // call Gemini embedding model to get embedding vector
        const embeddingResponse = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: chunk.content,
          config: {
            outputDimensionality: 768, // must match the vector dimension (vector(768))
            taskType: 'RETRIEVAL_DOCUMENT',
          },
        });

        const embeddingVector = embeddingResponse.embeddings?.[0]?.values;
        if (!embeddingVector) throw new Error(`Embedding failed for chunk ${chunk.chunkIndex}`);

        // insert into `document_chunks` table
        rows.push({
          document_id: docData.id,
          content: chunk.content,
          embedding: JSON.stringify(embeddingVector),
          metadata: { chunkIndex: chunk.chunkIndex, fileName: file.name },
        });
      }
    } catch {}
  } catch (error: unknown) {
    console.error('File Processing Error:', error);
    return { success: false, error: (error as Error).message || 'File processing failed' };
  }
}
