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
  console.log('DEBUG: Starting thumbnail generation with file:', videoFile.name, videoFile.type, videoFile.size);
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('DEBUG: Canvas context not available');
      reject(new Error('Canvas context not available'));
      return;
    }

    console.log('DEBUG: Canvas context created successfully');

    video.preload = 'metadata';
    video.muted = true;
    video.crossOrigin = 'anonymous';
    
    let metadataLoaded = false;
    let seekCompleted = false;
    
    const cleanup = () => {
      try {
        if (video.src) {
          URL.revokeObjectURL(video.src);
          video.src = '';
        }
      } catch (e) {
        console.warn('DEBUG: Cleanup warning:', e);
      }
    };
    
    const timeout = setTimeout(() => {
      console.error('DEBUG: Thumbnail generation timeout after 10 seconds');
      cleanup();
      reject(new Error('Thumbnail generation timeout'));
    }, 10000);
    
    video.addEventListener('loadedmetadata', () => {
      console.log('DEBUG: Video metadata loaded - duration:', video.duration, 'dimensions:', video.videoWidth, 'x', video.videoHeight);
      metadataLoaded = true;
      
      try {
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.error('DEBUG: Invalid video dimensions');
          clearTimeout(timeout);
          cleanup();
          reject(new Error('Invalid video dimensions'));
          return;
        }
        
        // Set canvas dimensions to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log('DEBUG: Canvas dimensions set to:', canvas.width, 'x', canvas.height);
        
        // Seek to specified time
        const seekTime = Math.min(timeInSeconds, video.duration);
        console.log('DEBUG: Seeking to time:', seekTime);
        video.currentTime = seekTime;
      } catch (error) {
        console.error('DEBUG: Error in loadedmetadata handler:', error);
        clearTimeout(timeout);
        cleanup();
        reject(new Error('Failed to set video metadata: ' + error));
      }
    });

    video.addEventListener('seeked', () => {
      console.log('DEBUG: Video seeked successfully, current time:', video.currentTime);
      seekCompleted = true;
      
      try {
        // Draw the video frame on canvas
        console.log('DEBUG: Drawing video frame to canvas...');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to base64 image
        console.log('DEBUG: Converting canvas to data URL...');
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        
        if (!thumbnail || thumbnail.length < 100) {
          console.error('DEBUG: Generated thumbnail is invalid or too small');
          clearTimeout(timeout);
          cleanup();
          reject(new Error('Generated thumbnail is invalid'));
          return;
        }
        
        console.log('DEBUG: Thumbnail generated successfully, size:', thumbnail.length, 'bytes');
        
        clearTimeout(timeout);
        cleanup();
        resolve(thumbnail);
      } catch (error) {
        console.error('DEBUG: Error in seeked handler:', error);
        clearTimeout(timeout);
        cleanup();
        reject(error);
      }
    });

    video.addEventListener('error', (event) => {
      console.error('DEBUG: Video loading error event:', event);
      console.error('DEBUG: Video error details:', video.error);
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Video loading failed: ' + (video.error?.message || 'Unknown error')));
    });

    video.addEventListener('loadstart', () => {
      console.log('DEBUG: Video load started');
    });

    video.addEventListener('loadeddata', () => {
      console.log('DEBUG: Video data loaded');
    });

    video.addEventListener('canplay', () => {
      console.log('DEBUG: Video can play');
    });

    // Create object URL and set as video source
    try {
      console.log('DEBUG: Creating object URL for video file...');
      const url = URL.createObjectURL(videoFile);
      console.log('DEBUG: Object URL created successfully:', url.substring(0, 50) + '...');
      video.src = url;
      console.log('DEBUG: Video src set, waiting for metadata...');
    } catch (error) {
      console.error('DEBUG: Failed to create object URL:', error);
      clearTimeout(timeout);
      reject(new Error('Failed to create object URL: ' + error));
    }
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
  console.log('DEBUG: Starting thumbnail upload with fileName:', fileName);
  console.log('DEBUG: Base64 thumbnail length:', base64Thumbnail.length);
  
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    // Convert base64 to blob
    console.log('DEBUG: Converting base64 to blob...');
    const base64Data = base64Thumbnail.split(',')[1];
    
    if (!base64Data) {
      throw new Error('Invalid base64 data - no data after comma');
    }
    
    console.log('DEBUG: Base64 data length after split:', base64Data.length);
    
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    
    console.log('DEBUG: Blob created successfully, size:', blob.size, 'bytes');
    
    // Upload to Supabase storage
    const thumbnailPath = `thumbnails/${fileName}_${Date.now()}.jpg`;
    console.log('DEBUG: Uploading to path:', thumbnailPath);
    
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(thumbnailPath, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('DEBUG: Supabase upload error:', error);
      throw error;
    }

    console.log('DEBUG: Upload successful, data:', data);

    // Get public URL
    console.log('DEBUG: Getting public URL for path:', data.path);
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(data.path);

    console.log('DEBUG: Public URL generated:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('DEBUG: Error uploading thumbnail:', error);
    console.error('DEBUG: Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};