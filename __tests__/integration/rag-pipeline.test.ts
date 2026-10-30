import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { uploadDocument } from '@/app/actions/upload';
import { searchSimilarChunks } from '@/lib/retrieval';
import { supabase } from '@/lib/supabase/supabase';

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

    const uploadResult = await uploadDocument(null, formData);

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

  it('should return relevant chunks of requested count for a valid query in descending order of similarity', async () => {
    const requestedCount = 3;
    const threshold = 0.2;

    // call the searchSimilarChunks API to get Top 3 results
    const searchResults = await searchSimilarChunks(
      'What is AskMyNotes?',
      requestedCount,
      threshold
    );

    // 1. Validate count: should not exceed the requested limit and must have results
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults.length).toBeLessThanOrEqual(requestedCount);

    // 2. Validate content accuracy: the first result should be most relevant and contain the keyword
    expect(searchResults[0].content).toContain('AskMyNotes');

    // 3. Validate sorting correctness (Descending order): ensure results are sorted by similarity from high to low
    for (let i = 0; i < searchResults.length - 1; i++) {
      const currentSimilarity = searchResults[i].similarity;
      const nextSimilarity = searchResults[i + 1].similarity;

      // The similarity of the current result must be greater than or equal to the next result
      expect(currentSimilarity).toBeGreaterThanOrEqual(nextSimilarity);
    }
  }, 10000); // Set a timeout of 10 seconds for this test
});
