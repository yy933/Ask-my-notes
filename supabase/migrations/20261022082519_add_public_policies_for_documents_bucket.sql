-- Allow uploading files to documents bucket publicly
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
-- Allow reading files publicly
CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT USING (bucket_id = 'documents');