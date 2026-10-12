-- 1. Create HNSW Index for embeddings to improve cosine similarity search performance
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- 2. Create Vector Search RPC Function
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 5
)
-- returns a table of document chunks that match the query embedding based on cosine similarity
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;