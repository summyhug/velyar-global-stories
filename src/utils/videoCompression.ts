export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  initialQuality?: number;
}

export const compressVideo = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxSizeMB = 50, // 50MB max
    maxWidthOrHeight = 1280, // Max 1280p
    useWebWorker = true,
    fileType = 'video/mp4',
    initialQuality = 0.8
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.onloadedmetadata = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { videoWidth, videoHeight } = video;
      
      if (videoWidth > maxWidthOrHeight || videoHeight > maxWidthOrHeight) {
        const aspectRatio = videoWidth / videoHeight;
        if (videoWidth > videoHeight) {
          videoWidth = maxWidthOrHeight;
          videoHeight = maxWidthOrHeight / aspectRatio;
        } else {
          videoHeight = maxWidthOrHeight;
          videoWidth = maxWidthOrHeight * aspectRatio;
        }
      }

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Create MediaRecorder for compression
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8',
        videoBitsPerSecond: 2000000 // 2 Mbps
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        
        // Check if compressed size is acceptable
        if (blob.size <= maxSizeMB * 1024 * 1024) {
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webm'), {
            type: 'video/webm',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          // If still too large, try with lower quality
          reject(new Error('Video still too large after compression'));
        }
      };

      mediaRecorder.onerror = (error) => {
        reject(error);
      };

      // Start recording and play video
      mediaRecorder.start();
      video.currentTime = 0;
      video.play();

      const drawFrame = () => {
        if (video.ended) {
          mediaRecorder.stop();
          return;
        }
        
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        requestAnimationFrame(drawFrame);
      };

      drawFrame();
    };

    video.onerror = () => {
      reject(new Error('Error loading video for compression'));
    };

    video.src = URL.createObjectURL(file);
    video.load();
  });
};

export const getVideoInfo = (file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  size: number;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size
      });
    };

    video.onerror = () => {
      reject(new Error('Error loading video metadata'));
    };

    video.src = URL.createObjectURL(file);
    video.load();
  });
};