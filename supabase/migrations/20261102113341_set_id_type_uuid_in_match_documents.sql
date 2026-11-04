-- 1. Remove old RPC function
DROP FUNCTION IF EXISTS match_documents(vector, double precision, integer, uuid);

-- 2. Create match_documents function with correct types
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector,
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
RETURNS TABLE (
  id uuid,               -- Make sure it aligns with document_chunks.id(uuid) 
  document_id uuid,      -- Make sure it aligns with documents.id (uuid) 
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where document_chunks.user_id = filter_user_id
    and 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;