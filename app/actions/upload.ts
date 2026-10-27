'use server';

import { ai } from '@/lib/gemini';
import { PDFParse } from 'pdf-parse';
import { chunkText } from '@/lib/chunking';
import { supabase } from '@/lib/supabase';
import { getFriendlyErrorMessage } from '@/lib/errorHandler';
import { revalidatePath } from 'next/cache';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB
const EMBEDDING_MODEL = 'gemini-embedding-001';
const STORAGE_BUCKET = 'documents';

// 1. Upload files (insert records into documents table and bucket)
export async function uploadDocument(
  prevState: { success: boolean; message: string } | null,
  formData: FormData
) {
   let uploadedStoragePath: string | null = null;
   try{
    const file = formData.get('file') as File;
     if (!file || file.size === 0) {
      return { success: false, message: 'No file provided.' };
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds the 3MB limit. Please upload a smaller file.');
    }


    // 1. Read file content based on its type (PDF or TXT) and extract raw text with parser
    let rawText = '';
    const arrayBuffer = await file.arrayBuffer();

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const parser = new PDFParse({ data: new Uint8Array(arrayBuffer.slice(0)) });
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
      .upload(uniqueFileName, arrayBuffer.slice(0), {
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
        status: 'pending'
      })
      .select()
      .single();

    if (docError || !docData)
      throw new Error(`Failed to create document record: ${docError?.message}`);

    revalidatePath('/documents');

    return {
      success: true,
      documentId: docData.id,
      message: 'File uploaded successfully! You can now build its AI index from the documents list.',
    };
   } catch(error) {
    console.error('Upload Error:', error);
    if (uploadedStoragePath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([uploadedStoragePath]);
    }
    return {
      success: false,
      message: getFriendlyErrorMessage(error),
    };
  }


  
 

// 2. Chunking and embedding (read raw_text in documents table)
export async function buildDocumentIndex(documentId: string){
  try{
const {data:doc, error: fetchError} = await supabase.from('documents').select('id, title, raw_text').eq('id', documentId).single()

if(fetchError || !doc || !doc.raw_text){
  throw new Error('Document not found or raw text is empty.');
}

    // Chunking and embedding (synchronous, so failures are reported to the user)
    const chunks = chunkText(doc.raw_text, 1500, 150);
    if (chunks.length === 0) throw new Error('No chunks were created from the document content.');

    // Generate embeddings in batches to avoid Gemini Free Tier Rate Limit (100 req/min)
    const rows = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const embeddingResponse = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: chunk.content,
        config: {
          outputDimensionality: 768,
          taskType: 'RETRIEVAL_DOCUMENT',
        },
      });

      const embeddingVector = embeddingResponse.embeddings?.[0]?.values;
      if (!embeddingVector) throw new Error(`Embedding failed for chunk ${chunk.chunkIndex}`);

      // Prepare the row for insertion
      rows.push({
        document_id: doc.id,
        content: chunk.content,
        embedding: JSON.stringify(embeddingVector),
        metadata: { chunkIndex: chunk.chunkIndex, fileName: doc.title },
      });

      // pause between each chunk
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    // Insert all chunks into `document_chunks` table
    if (rows.length > 0) {
      await supabase.from('document_chunks').insert(rows);
    }

    // update status to 'completed'
   const {error: updateError} = await supabase.from('documents').update({status: 'completed'}).eq('id', doc.id);
   if(updateError) throw new Error(`Failed to update document status: ${updateError.message}`);
   revalidatePath('/documents')

   return { success: true, message: 'Your file has been read through!' };


  }catch(error){
    console.error('Build Index Error: ', error)
    await supabase.from('documents').update({ status: 'failed' }).eq('id', documentId);
    return { success: false, message: getFriendlyErrorMessage(error) };
  }
}











// export async function processAndStoreDocument(
//   prevState: { success: boolean; message: string } | null,
//   formData: FormData
// ) {
//   let uploadedStoragePath: string | null = null;
//   let docDataId: string | null = null;
//   try {
//     const file = formData.get('file') as File;
//     if (!file || file.size === 0) {
//       return { success: false, message: 'No file provided.' };
//     }
//     if (file.size > MAX_FILE_SIZE) throw new Error('File size exceeds the 10MB limit.');

//     // 1. Read file content based on its type (PDF or TXT) and extract raw text with parser
//     let rawText = '';
//     const arrayBuffer = await file.arrayBuffer();

//     if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
//       const parser = new PDFParse({ data: new Uint8Array(arrayBuffer.slice(0)) });
//       try {
//         const result = await parser.getText();
//         rawText = result.text;
//       } finally {
//         await parser.destroy();
//       }
//     } else if (file.type.startsWith('text/plain') || file.name.endsWith('.txt')) {
//       rawText = Buffer.from(arrayBuffer).toString('utf-8');
//     } else {
//       throw new Error('Unsupported file format. Only .txt and .pdf files are supported.');
//     }

//     if (!rawText.trim()) throw new Error('File content is empty');

//     // 2. upload file to supabase bucket
//     const fileExt = file.name.split('.').pop();
//     const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
//     const { data: storageData, error: storageError } = await supabase.storage
//       .from(STORAGE_BUCKET)
//       .upload(uniqueFileName, arrayBuffer.slice(0), {
//         contentType: file.type,
//         upsert: false,
//       });

//     if (storageError || !storageData)
//       throw new Error(`Failed to create document record: ${storageError?.message}`);
//     uploadedStoragePath = storageData.path;

//     // get document public url
//     const { data: publicUrlData } = supabase.storage
//       .from(STORAGE_BUCKET)
//       .getPublicUrl(uploadedStoragePath);
//     const publicUrl = publicUrlData.publicUrl;

//     // 3. write data into documents table
//     const { data: docDataResult, error: docError } = await supabase
//       .from('documents')
//       .insert({
//         title: file.name,
//         file_path: publicUrl,
//         raw_text: rawText,
//       })
//       .select()
//       .single();

//     if (docError || !docDataResult)
//       throw new Error(`Failed to create document record: ${docError?.message}`);

//     docDataId = docDataResult.id;

//     // 4. Chunking and embedding (synchronous, so failures are reported to the user)
//     const chunks = chunkText(rawText, 1500, 150);
//     if (chunks.length === 0) throw new Error('No chunks were created from the document content.');

//     // 5. Generate embeddings in batches to avoid Gemini Free Tier Rate Limit (100 req/min)
//     const rows = [];

//     for (let i = 0; i < chunks.length; i++) {
//       const chunk = chunks[i];

//       const embeddingResponse = await ai.models.embedContent({
//         model: EMBEDDING_MODEL,
//         contents: chunk.content,
//         config: {
//           outputDimensionality: 768,
//           taskType: 'RETRIEVAL_DOCUMENT',
//         },
//       });

//       const embeddingVector = embeddingResponse.embeddings?.[0]?.values;
//       if (!embeddingVector) throw new Error(`Embedding failed for chunk ${chunk.chunkIndex}`);

//       // Prepare the row for insertion
//       rows.push({
//         document_id: docDataId,
//         content: chunk.content,
//         embedding: JSON.stringify(embeddingVector),
//         metadata: { chunkIndex: chunk.chunkIndex, fileName: file.name },
//       });

//       // pause between each chunk
//       if (i < chunks.length - 1) {
//         await new Promise((resolve) => setTimeout(resolve, 3000));
//       }
//     }

//     // 6. Insert all chunks into `document_chunks` table
//     if (rows.length > 0) {
//       await supabase.from('document_chunks').insert(rows);
//     }

//     console.log(`Embedding completed for document: ${docDataId}`);

//     // response return to client (embedding completed before sending response)
//     return {
//       success: true,
//       documentId: docDataId,
//       chunkCount: chunks.length,
//       message: 'Your file is successfully uploaded.',
//     };
//   } catch (error: unknown) {
//     console.error('File Processing Error:', error);
//     // cleanup document record if it was created but embedding failed
//     if (docDataId) {
//       await supabase.from('documents').delete().eq('id', docDataId);
//     }
//     // if error occured before data insertion, remove the uploaded files
//     if (uploadedStoragePath) {
//       await supabase.storage.from(STORAGE_BUCKET).remove([uploadedStoragePath]);
//     }
//     console.error(error);
//     return {
//       success: false,
//       message: getFriendlyErrorMessage(error),
//     };
//   }
// }