-- Drop old foreign key constraint（ document_chunks_document_id_fkey ）
ALTER TABLE document_chunks
DROP CONSTRAINT IF EXISTS document_chunks_document_id_fkey;

-- Add ON DELETE CASCADE foreign key constraint
ALTER TABLE document_chunks
ADD CONSTRAINT document_chunks_document_id_fkey
FOREIGN KEY (document_id)
REFERENCES documents(id)
ON DELETE CASCADE;