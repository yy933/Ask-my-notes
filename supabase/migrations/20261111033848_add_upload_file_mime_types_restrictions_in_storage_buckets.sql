-- Add file size and MIME types restrictions in buckets
UPDATE storage.buckets
SET 
  file_size_limit = 3145728, -- 3 MB 
  allowed_mime_types = ARRAY['application/pdf', 'text/plain', 'text/markdown', 'text/x-markdown']::text[]
WHERE id = 'documents';