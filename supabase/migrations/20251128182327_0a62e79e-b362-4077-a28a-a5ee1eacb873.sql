-- Create storage bucket for titulo documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('titulo-documentos', 'titulo-documentos', false);

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload titulo documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'titulo-documentos');

-- Allow users to view their own uploaded documents
CREATE POLICY "Users can view titulo documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'titulo-documentos');

-- Allow users to delete their own documents
CREATE POLICY "Users can delete titulo documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'titulo-documentos');

-- Add column to store document URL in titulos table
ALTER TABLE public.titulos
ADD COLUMN documento_url text;