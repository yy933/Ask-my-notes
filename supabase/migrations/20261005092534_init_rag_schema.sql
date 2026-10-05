-- Enable the pgvector extension for vector operations
create extension if not exists vector;

-- 1. Create documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  file_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create document chunks table
-- Gemini text-embedding-004 generates vectors with 768 dimensions
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade not null,
  content text not null,
  embedding vector(768),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create vector HNSW index (improve retrieval speed for large datasets)
create index if not exists document_chunks_embedding_hnsw_idx 
on public.document_chunks 
using hnsw (embedding vector_cosine_ops);

-- 4. Create RAG vector cosine similarity comparison function (RPC Function)
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;