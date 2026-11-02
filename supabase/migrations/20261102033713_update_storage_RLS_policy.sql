-- 1. User can only select their own files (SELECT)
CREATE POLICY "Users can read their own storage files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. User can only upload files to their own folders (INSERT)
CREATE POLICY "Users can upload to their own storage folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. User can only update their own files (UPDATE)
CREATE POLICY "Users can update their own storage files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. User can only delete their own files (DELETE)
CREATE POLICY "Users can delete their own storage files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);