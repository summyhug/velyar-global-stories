-- First, check and fix existing storage policies
-- Drop existing policies if they exist and recreate them correctly

DROP POLICY IF EXISTS "Users can upload thumbnails to videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all files in videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in videos bucket" ON storage.objects;

-- Create corrected storage policies for videos bucket
CREATE POLICY "Users can upload files to videos bucket" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can view files in videos bucket" 
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
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own files in videos bucket" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update bucket file size limit to 100MB to handle larger videos
UPDATE storage.buckets 
SET file_size_limit = 104857600
WHERE id = 'videos';