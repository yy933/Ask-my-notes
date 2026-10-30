-- ==========================================
-- 1. add user_id column to documents and document_chunks column
-- ==========================================

-- 如果之前測試資料需要清理，可以先執行 TRUNCATE documents CASCADE;（選填）

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE document_chunks 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- ==========================================
-- 2. 開啟 Row Level Security (RLS)
-- ==========================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. 建立 documents 的 RLS 政策
-- ==========================================

-- 刪除舊政策（若有的話）避免重複建立報錯
DROP POLICY IF EXISTS "Users can only manage their own documents" ON documents;

CREATE POLICY "Users can only manage their own documents"
ON documents 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 4. 建立 document_chunks 的 RLS 政策
-- ==========================================

DROP POLICY IF EXISTS "Users can only manage chunks of their own documents" ON document_chunks;

CREATE POLICY "Users can only manage chunks of their own documents"
ON document_chunks 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);