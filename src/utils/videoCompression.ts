export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  initialQuality?: number;
}

export const compressVideo = async (
  file: File,
  options: CompressionOptions = {},
  attempt: number = 1
): Promise<File> => {
  const {
    maxSizeMB = 10, // 10MB max - save storage with audio preserved
    maxWidthOrHeight = 1920, // Max 1920p (Full HD)
    useWebWorker = true,
    fileType = 'video/mp4',
    initialQuality = 0.8
  } = options;

  const fileSizeMB = file.size / (1024 * 1024);
  
  // Adaptive compression settings based on file size and attempt number
  // For 400MB+ files, we need very aggressive compression
  let videoBitrate: number;
  let targetResolution: number;
  let targetFPS: number;
  
  // First attempt: aggressive settings for large files
  if (fileSizeMB > 300 || attempt > 1) {
    // Very large files or retry: ultra-aggressive
    videoBitrate = 800000; // 0.8 Mbps - very low bitrate
    targetResolution = 720; // 720p
    targetFPS = 24;
  } else if (fileSizeMB > 200) {
    // Very large files: very aggressive
    videoBitrate = 1200000; // 1.2 Mbps
    targetResolution = 960; // ~960p
    targetFPS = 24;
  } else if (fileSizeMB > 100) {
    // Large files: aggressive
    videoBitrate = 2000000; // 2 Mbps
    targetResolution = 1280; // 720p HD
    targetFPS = 24;
  } else if (fileSizeMB > 50) {
    // Medium-large files: moderate
    videoBitrate = 3000000; // 3 Mbps
    targetResolution = 1600;
    targetFPS = 30;
  } else {
    // Smaller files: standard
    videoBitrate = 4000000; // 4 Mbps
    targetResolution = maxWidthOrHeight;
    targetFPS = 30;
  }

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
      
      if (videoWidth > targetResolution || videoHeight > targetResolution) {
        const aspectRatio = videoWidth / videoHeight;
        if (videoWidth > videoHeight) {
          videoWidth = targetResolution;
          videoHeight = targetResolution / aspectRatio;
        } else {
          videoHeight = targetResolution;
          videoWidth = targetResolution * aspectRatio;
        }
      }

      // Round to even numbers (required for codecs)
      videoWidth = Math.floor(videoWidth / 2) * 2;
      videoHeight = Math.floor(videoHeight / 2) * 2;

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Get audio track from original video
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      
      // Create combined stream with video from canvas and audio from original
      const videoStream = canvas.captureStream(targetFPS);
      const audioTracks = destination.stream.getAudioTracks();
      
      // Combine video and audio tracks
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioTracks
      ]);

      // Try different codecs for better compatibility
      const codecs = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];

      let selectedMimeType = codecs[0];
      for (const codec of codecs) {
        if (MediaRecorder.isTypeSupported(codec)) {
          selectedMimeType = codec;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: videoBitrate,
        audioBitsPerSecond: 96000 // Reduced audio bitrate for very large files
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedMimeType });
        const compressedSizeMB = blob.size / (1024 * 1024);
        
        // Check if compressed size is acceptable
        if (blob.size <= maxSizeMB * 1024 * 1024) {
          const extension = selectedMimeType.includes('webm') ? 'webm' : 'mp4';
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, `.${extension}`), {
            type: selectedMimeType,
            lastModified: Date.now(),
          });
          audioContext.close();
          resolve(compressedFile);
        } else {
          // If still too large, retry with even more aggressive settings
          audioContext.close();
          
          if (attempt < 3 && videoBitrate > 500000) {
            // Retry with lower bitrate and resolution
            console.log(`Retry ${attempt + 1}: Compressed to ${compressedSizeMB.toFixed(1)}MB, retrying with lower quality...`);
            compressVideo(file, {
              ...options,
              maxSizeMB,
              maxWidthOrHeight: Math.max(480, targetResolution - 200),
            }, attempt + 1).then(resolve).catch(reject);
          } else {
            reject(new Error(`Video still too large after compression: ${compressedSizeMB.toFixed(1)}MB (target: ${maxSizeMB}MB). Try a shorter video or lower resolution source.`));
          }
        }
      };

      mediaRecorder.onerror = (error) => {
        audioContext.close();
        reject(error);
      };

      // Start recording and play video
      mediaRecorder.start(1000); // Collect data every second
      video.currentTime = 0;
      
      video.onseeked = () => {
        video.play();
      };
      
      video.onended = () => {
        mediaRecorder.stop();
      };
      
      video.onerror = () => {
        audioContext.close();
        reject(new Error('Error playing video for compression'));
      };

      const drawFrame = () => {
        if (video.ended) {
          // Don't stop here, let onended handle it
          return;
        }
        
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        }
        requestAnimationFrame(drawFrame);
      };

      video.onloadeddata = () => {
        drawFrame();
      };
    };

    video.onerror = () => {
      reject(new Error('Error loading video for compression'));
    };

    video.preload = 'metadata';
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