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
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    video.crossOrigin = 'anonymous';
    
    const cleanup = () => {
      try {
        if (video.src) {
          URL.revokeObjectURL(video.src);
          video.src = '';
        }
        video.removeEventListener('loadedmetadata', onMetadataLoaded);
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
      } catch (e) {
        // Silent cleanup
      }
    };
    
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Thumbnail generation timeout'));
    }, 5000); // Reduced timeout to 5 seconds
    
    const onMetadataLoaded = () => {
      try {
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          clearTimeout(timeout);
          cleanup();
          reject(new Error('Invalid video dimensions'));
          return;
        }
        
        // Limit canvas size to prevent memory issues
        const maxSize = 1280;
        const aspectRatio = video.videoWidth / video.videoHeight;
        
        if (video.videoWidth > video.videoHeight) {
          canvas.width = Math.min(video.videoWidth, maxSize);
          canvas.height = canvas.width / aspectRatio;
        } else {
          canvas.height = Math.min(video.videoHeight, maxSize);
          canvas.width = canvas.height * aspectRatio;
        }
        
        const seekTime = Math.min(timeInSeconds, video.duration - 0.1);
        video.currentTime = seekTime;
      } catch (error) {
        clearTimeout(timeout);
        cleanup();
        reject(new Error('Failed to set video metadata'));
      }
    };

    const onSeeked = () => {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7); // Reduced quality
        
        if (!thumbnail || thumbnail.length < 100) {
          clearTimeout(timeout);
          cleanup();
          reject(new Error('Generated thumbnail is invalid'));
          return;
        }
        
        clearTimeout(timeout);
        cleanup();
        resolve(thumbnail);
      } catch (error) {
        clearTimeout(timeout);
        cleanup();
        reject(error);
      }
    };

    const onError = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Video loading failed'));
    };

    video.addEventListener('loadedmetadata', onMetadataLoaded);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);

    try {
      const url = URL.createObjectURL(videoFile);
      video.src = url;
    } catch (error) {
      clearTimeout(timeout);
      reject(new Error('Failed to create object URL'));
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
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    const base64Data = base64Thumbnail.split(',')[1];
    
    if (!base64Data) {
      throw new Error('Invalid base64 data');
    }
    
    // More efficient base64 to blob conversion
    const response = await fetch(base64Thumbnail);
    const blob = await response.blob();
    
    const thumbnailPath = `thumbnails/${fileName}_${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(thumbnailPath, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Thumbnail upload failed:', error);
    throw error;
  }
};