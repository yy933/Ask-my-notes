import { describe, it, expect, afterAll } from 'vitest';
import { processAndStoreDocument } from '@/app/actions/upload';
import { searchSimilarChunks } from '@/lib/retrieval';
import { supabase } from '@/lib/supabase';

describe('RAG Pipeline Integration Test', () => {
  let createdDocumentId: string | undefined;

  it('should successfully upload a file, chunk it, and store it in Supabase, and be retrievable via vector search', async () => {
    // 1. Prepare test data (FormData)
    const testContent =
      'AskMyNotes is an RAG document retrieval system based on Next.js and Supabase pgvector.';
    const blob = new Blob([testContent], { type: 'text/plain' });
    const file = new File([blob], 'test-doc.txt', { type: 'text/plain' });

    const formData = new FormData();
    formData.append('file', file);

    // 2.  Ingestion Pipeline: Server Action
    const uploadResult = await processAndStoreDocument(null, formData);

    expect(uploadResult.success).toBe(true);
    expect(uploadResult.documentId).toBeDefined();

    createdDocumentId = uploadResult.documentId;

    // 3. Retrieval Pipeline: Search for similar chunks using a query
    const searchResults = await searchSimilarChunks('What is AskMyNotes?', 3, 0.2);

    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].content).toContain('AskMyNotes');
  }, 15000); // API calls and embedding generation may take some time, so we set a timeout of 15 seconds.

  // Test cleanup after all tests are done
  afterAll(async () => {
    if (createdDocumentId) {
      await supabase.from('documents').delete().eq('id', createdDocumentId);
      console.log('Test data cleanup completed');
    }
  });
});
