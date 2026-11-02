-- Update match_documents function: add filter_user_id 
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
RETURNS TABLE (
  id bigint,
  document_id bigint,
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
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
    and document_chunks.user_id = filter_user_id -- user can only check chunks that match current user_id
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;