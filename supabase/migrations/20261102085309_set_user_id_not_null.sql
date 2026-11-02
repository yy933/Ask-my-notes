-- 1. Set user_id NOT NULL
ALTER TABLE documents ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE document_chunks ALTER COLUMN user_id SET NOT NULL;

-- 3. Set default user_id as current user id
ALTER TABLE documents ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE document_chunks ALTER COLUMN user_id SET DEFAULT auth.uid();