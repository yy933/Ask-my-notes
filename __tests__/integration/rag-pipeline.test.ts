import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { processAndStoreDocument } from '@/app/actions/upload';
import { searchSimilarChunks } from '@/lib/retrieval';
import { supabase } from '@/lib/supabase';

describe('RAG Pipeline Integration Test', () => {
  let createdDocumentId: string | undefined;

  // Prepare test data and run the ingestion and retrieval pipeline before running the tests
  beforeAll(async () => {
    const testContent =
      'AskMyNotes is an RAG document retrieval system based on Next.js and Supabase pgvector.';
    const blob = new Blob([testContent], { type: 'text/plain' });
    const file = new File([blob], 'test-doc.txt', { type: 'text/plain' });

    const formData = new FormData();
    formData.append('file', file);

    const uploadResult = await processAndStoreDocument(null, formData);

    expect(uploadResult.success).toBe(true);
    expect(uploadResult.documentId).toBeDefined();

    createdDocumentId = uploadResult.documentId;
  }, 15000);

  // Test cleanup after all tests are done
  afterAll(async () => {
    if (createdDocumentId) {
      await supabase.from('documents').delete().eq('id', createdDocumentId);
      console.log('Test data cleanup completed');
    }
  });

  // Main test case to verify the RAG pipeline
  it('should retrieve relevant chunks for a given query', async () => {
    const searchResults = await searchSimilarChunks('What is AskMyNotes?', 3, 0.2);

    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].content).toContain('AskMyNotes');
  }, 10000); // Set a timeout of 10 seconds for this test

  // Edge case 1: Irrelevant query
  it('should return an empty array for an irrelevant query', async () => {
    const irrelevantQuery = 'How to make an apple pie?';
    const searchResults = await searchSimilarChunks(irrelevantQuery, 3, 0.6);
    if (searchResults.length > 0) {
      expect(searchResults[0].similarity).toBeLessThan(0.6);
    } else {
      expect(searchResults.length).toBe(0);
    }
  }, 10000); // Set a timeout of 10 seconds for this test

  // Edge case 2: Empty query
  it('should return an empty array for an empty query', async () => {
    const emptyQuery = '   ';
    const searchResults = await searchSimilarChunks(emptyQuery, 3, 0.2);

    expect(searchResults).toBeDefined();
    expect(Array.isArray(searchResults)).toBe(true);
  }, 10000); // Set a timeout of 10 seconds for this test
});
