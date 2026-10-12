import { ai } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { ChunkSearchResult } from '@/types';

const EMBEDDING_MODEL = 'gemini-embedding-001';

export async function searchSimilarChunks(
  query: string,
  matchCount: number = 5,
  threshold: number = 0.3
): Promise<ChunkSearchResult[]> {
  // Edge case 1: Handle empty query
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  // 1. Generate embedding for the query using Gemini API
  const embeddingResponse = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: trimmedQuery,
    config: {
      outputDimensionality: 768, // must match the vector dimension (vector(768))
      taskType: 'RETRIEVAL_QUERY', // specify the task type for query retrieval(search)
    },
  });

  const queryEmbedding = embeddingResponse.embeddings?.[0]?.values;
  if (!queryEmbedding) {
    throw new Error('Failed to generate embedding for the query.');
  }

  // 2. Call the Supabase RPC function to search for similar chunks
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: JSON.stringify(queryEmbedding), // Supabase expects a string for the embedding column
    match_count: matchCount,
    match_threshold: threshold,
  });

  if (error) {
    console.error('Vector Search Error:', error);
    throw new Error(`Vector search failed: ${error.message}`);
  }
  // Edge case 2: When Supabase returns null or undefined data, return an empty array
  return (data as ChunkSearchResult[]) ?? [];
}
