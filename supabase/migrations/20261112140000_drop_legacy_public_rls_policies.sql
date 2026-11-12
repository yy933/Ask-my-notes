-- Drop legacy public RLS policies on documents table
DROP POLICY IF EXISTS "Allow public insert to documents" ON documents;
DROP POLICY IF EXISTS "Allow public select to documents" ON documents;
DROP POLICY IF EXISTS "Allow public delete to documents" ON documents;

-- Drop legacy public RLS policies on document_chunks table
DROP POLICY IF EXISTS "Allow public insert to document_chunks" ON document_chunks;
DROP POLICY IF EXISTS "Allow public select to document_chunks" ON document_chunks;
DROP POLICY IF EXISTS "Allow public delete to document_chunks" ON document_chunks;

-- Drop legacy public RLS policies on storage.objects
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;