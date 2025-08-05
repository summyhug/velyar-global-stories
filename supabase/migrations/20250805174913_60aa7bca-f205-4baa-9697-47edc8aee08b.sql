-- Create storage policies for video thumbnails
CREATE POLICY "Users can upload thumbnails to videos bucket" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view all files in videos bucket" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'videos');

CREATE POLICY "Users can update their own files in videos bucket" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files in videos bucket" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);