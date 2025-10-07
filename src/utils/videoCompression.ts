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
    maxSizeMB = 10, // 10MB max - save storage with audio preserved
    maxWidthOrHeight = 1920, // Max 1920p (Full HD)
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

      // Get audio track from original video
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      
      // Create combined stream with video from canvas and audio from original
      const videoStream = canvas.captureStream(30); // 30 FPS
      const audioTracks = destination.stream.getAudioTracks();
      
      // Combine video and audio tracks
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioTracks
      ]);

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 4000000, // 4 Mbps - good quality with audio
        audioBitsPerSecond: 128000 // 128 kbps audio
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
        
        // Clean up audio context
        audioContext.close();
      };

      mediaRecorder.onerror = (error) => {
        audioContext.close();
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