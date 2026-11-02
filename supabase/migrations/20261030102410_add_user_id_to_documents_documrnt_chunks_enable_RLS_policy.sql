-- ==========================================
-- 1. add user_id column to documents and document_chunks column
-- ==========================================

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE document_chunks 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- ==========================================
-- 2. Enable Row Level Security (RLS)
-- ==========================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. Create RLS policy in documents table
-- ==========================================

-- Drop old RLS policy（if exists）
DROP POLICY IF EXISTS "Users can only manage their own documents" ON documents;

CREATE POLICY "Users can only manage their own documents"
ON documents 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 4. Create RLS policy in document_chunks table
-- ==========================================

DROP POLICY IF EXISTS "Users can only manage chunks of their own documents" ON document_chunks;

CREATE POLICY "Users can only manage chunks of their own documents"
ON document_chunks 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);