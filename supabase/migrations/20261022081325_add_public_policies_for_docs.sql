-- 1.  documents table:  Policies that allow Insert, Select, Delete 
CREATE POLICY "Allow public insert to documents" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow public delete to documents" ON documents FOR DELETE USING (true);

-- 2. document_chunks table:  Policies that allow Insert, Select, Delete 
CREATE POLICY "Allow public insert to document_chunks" ON document_chunks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to document_chunks" ON document_chunks FOR SELECT USING (true);
CREATE POLICY "Allow public delete to document_chunks" ON document_chunks FOR DELETE USING (true);