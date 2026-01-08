-- Create storage policies for titulo-documentos bucket

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload files to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'titulo-documentos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'titulo-documentos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'titulo-documentos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access (bucket is already public)
CREATE POLICY "Public read access for titulo-documentos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'titulo-documentos');