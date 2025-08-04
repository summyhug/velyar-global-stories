/**
 * Generates a thumbnail from a video file using Canvas API
 * @param videoFile - The video file to extract thumbnail from
 * @param timeInSeconds - Time position to capture (default: 2 seconds)
 * @returns Promise<string> - Base64 data URL of the thumbnail
 */
export const generateVideoThumbnail = (
  videoFile: File, 
  timeInSeconds: number = 2
): Promise<string> => {
  console.log('generateVideoThumbnail: Starting thumbnail generation for file:', videoFile.name);
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('generateVideoThumbnail: Canvas context not available');
      reject(new Error('Canvas context not available'));
      return;
    }

    console.log('generateVideoThumbnail: Canvas context created successfully');

    video.preload = 'metadata';
    video.muted = true;
    
    video.addEventListener('loadedmetadata', () => {
      console.log('generateVideoThumbnail: Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
      console.log('generateVideoThumbnail: Video duration:', video.duration);
      
      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Seek to specified time
      const seekTime = Math.min(timeInSeconds, video.duration);
      console.log('generateVideoThumbnail: Seeking to time:', seekTime);
      video.currentTime = seekTime;
    });

    video.addEventListener('seeked', () => {
      try {
        console.log('generateVideoThumbnail: Video seeked successfully, drawing frame');
        
        // Draw the video frame on canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to base64 image
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        console.log('generateVideoThumbnail: Thumbnail generated successfully, length:', thumbnail.length);
        
        // Clean up
        video.src = '';
        if (video.src.startsWith('blob:')) {
          URL.revokeObjectURL(video.src);
        }
        
        resolve(thumbnail);
      } catch (error) {
        console.error('generateVideoThumbnail: Error during seeked event:', error);
        reject(error);
      }
    });

    video.addEventListener('error', (error) => {
      console.error('generateVideoThumbnail: Video loading error:', error);
      reject(new Error('Video loading failed: ' + error));
    });

    // Create object URL and set as video source
    const url = URL.createObjectURL(videoFile);
    console.log('generateVideoThumbnail: Setting video source to:', url);
    video.src = url;
  });
};

/**
 * Uploads a base64 thumbnail to Supabase storage
 * @param base64Thumbnail - Base64 encoded thumbnail
 * @param fileName - Name for the thumbnail file
 * @returns Promise<string> - Public URL of uploaded thumbnail
 */
export const uploadThumbnailToStorage = async (
  base64Thumbnail: string,
  fileName: string
): Promise<string> => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    // Convert base64 to blob
    const base64Data = base64Thumbnail.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    
    // Upload to Supabase storage
    const thumbnailPath = `thumbnails/${fileName}_${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(thumbnailPath, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    throw error;
  }
};