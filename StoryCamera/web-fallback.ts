/**
 * Web fallback for StoryCamera plugin
 * This allows testing the integration in the browser environment
 */

export interface RecordVideoOptions {
  duration?: number;
  camera?: 'front' | 'rear';
  allowOverlays?: boolean;
}

export interface RecordVideoResult {
  filePath: string;
  thumbnailPath: string;
  duration: number;
  size: number;
  camera: 'front' | 'rear';
  overlays: string[];
}

// Web fallback implementation
const webStoryCamera = {
  recordVideo: async (options: RecordVideoOptions = {}): Promise<RecordVideoResult> => {
    console.log('🌐 Web fallback: StoryCamera.recordVideo called with:', options);
    
    // Simulate camera permission request
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: options.camera === 'front' ? 'user' : 'environment' 
        } 
      });
      
      // Stop the stream immediately (we're just testing permissions)
      stream.getTracks().forEach(track => track.stop());
      
      // Simulate recording delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return mock result
      const result: RecordVideoResult = {
        filePath: '/mock/video.mp4',
        thumbnailPath: '/mock/thumbnail.jpg',
        duration: Math.random() * 20 + 5, // 5-25 seconds
        size: Math.floor(Math.random() * 3000000) + 1000000, // 1-4MB
        camera: options.camera || 'rear',
        overlays: options.allowOverlays ? ['text:Test Caption', 'emoji:😊'] : []
      };
      
      console.log('🌐 Web fallback: Mock recording successful:', result);
      return result;
      
    } catch (error) {
      console.error('🌐 Web fallback: Camera permission denied or error:', error);
      throw new Error('Camera permission denied or camera not available');
    }
  },
  
  ping: async () => {
    console.log('🌐 Web fallback: ping called');
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to simulate async
    return Promise.resolve();
  },
  
  addOverlay: async (overlayOptions: any) => {
    console.log('🌐 Web fallback: addOverlay called with:', overlayOptions);
    return Promise.resolve();
  },
  
  switchCamera: async () => {
    console.log('🌐 Web fallback: switchCamera called');
    return Promise.resolve();
  },
  
  cancelRecording: async () => {
    console.log('🌐 Web fallback: cancelRecording called');
    return Promise.resolve();
  }
};

// Export the web fallback
export default webStoryCamera;
