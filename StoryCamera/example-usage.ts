import StoryCamera, { RecordVideoOptions, RecordVideoResult } from './index';

/**
 * Example usage of the StoryCamera plugin in the Velyar app
 */

export class StoryCameraService {
  /**
   * Record a video with default settings
   */
  static async recordDefaultVideo(): Promise<RecordVideoResult> {
    try {
      const result = await StoryCamera.recordVideo();
      console.log('Video recorded successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to record video:', error);
      throw error;
    }
  }

  /**
   * Record a video with custom settings
   */
  static async recordCustomVideo(options: RecordVideoOptions): Promise<RecordVideoResult> {
    try {
      const result = await StoryCamera.recordVideo(options);
      console.log('Custom video recorded successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to record custom video:', error);
      throw error;
    }
  }

  /**
   * Record a story video (short format)
   */
  static async recordStoryVideo(): Promise<RecordVideoResult> {
    const options: RecordVideoOptions = {
      duration: 15, // 15 seconds for stories
      camera: 'front', // Default to front camera for selfies
      allowOverlays: true
    };

    return this.recordCustomVideo(options);
  }

  /**
   * Record a long-form video
   */
  static async recordLongVideo(): Promise<RecordVideoResult> {
    const options: RecordVideoOptions = {
      duration: 60, // 1 minute
      camera: 'rear', // Default to rear camera for content
      allowOverlays: true
    };

    return this.recordCustomVideo(options);
  }

  /**
   * Add text overlay to current recording
   */
  static async addTextOverlay(text: string): Promise<void> {
    try {
      await StoryCamera.addOverlay({
        type: 'text',
        data: text
      });
      console.log('Text overlay added:', text);
    } catch (error) {
      console.error('Failed to add text overlay:', error);
      throw error;
    }
  }

  /**
   * Add emoji overlay to current recording
   */
  static async addEmojiOverlay(emoji: string): Promise<void> {
    try {
      await StoryCamera.addOverlay({
        type: 'emoji',
        data: emoji
      });
      console.log('Emoji overlay added:', emoji);
    } catch (error) {
      console.error('Failed to add emoji overlay:', error);
      throw error;
    }
  }

  /**
   * Add filter overlay to current recording
   */
  static async addFilterOverlay(filter: 'grayscale' | 'warm' | 'cool' | 'bright'): Promise<void> {
    try {
      await StoryCamera.addOverlay({
        type: 'filter',
        data: filter
      });
      console.log('Filter overlay added:', filter);
    } catch (error) {
      console.error('Failed to add filter overlay:', error);
      throw error;
    }
  }

  /**
   * Switch camera during recording
   */
  static async switchCamera(): Promise<void> {
    try {
      await StoryCamera.switchCamera();
      console.log('Camera switched successfully');
    } catch (error) {
      console.error('Failed to switch camera:', error);
      throw error;
    }
  }

  /**
   * Cancel current recording
   */
  static async cancelRecording(): Promise<void> {
    try {
      await StoryCamera.cancelRecording();
      console.log('Recording cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel recording:', error);
      throw error;
    }
  }
}

// Example React component usage
export const StoryCameraExample: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<RecordVideoResult | null>(null);

  const handleRecordStory = async () => {
    try {
      setIsRecording(true);
      const result = await StoryCameraService.recordStoryVideo();
      setRecordedVideo(result);
      console.log('Story recorded:', result);
    } catch (error) {
      console.error('Failed to record story:', error);
    } finally {
      setIsRecording(false);
    }
  };

  const handleRecordLongVideo = async () => {
    try {
      setIsRecording(true);
      const result = await StoryCameraService.recordLongVideo();
      setRecordedVideo(result);
      console.log('Long video recorded:', result);
    } catch (error) {
      console.error('Failed to record long video:', error);
    } finally {
      setIsRecording(false);
    }
  };

  const handleAddTextOverlay = async () => {
    try {
      await StoryCameraService.addTextOverlay('Hello Velyar!');
    } catch (error) {
      console.error('Failed to add text overlay:', error);
    }
  };

  const handleAddEmojiOverlay = async () => {
    try {
      await StoryCameraService.addEmojiOverlay('😊');
    } catch (error) {
      console.error('Failed to add emoji overlay:', error);
    }
  };

  const handleAddFilterOverlay = async () => {
    try {
      await StoryCameraService.addFilterOverlay('warm');
    } catch (error) {
      console.error('Failed to add filter overlay:', error);
    }
  };

  return (
    <div className="story-camera-example">
      <h2>Story Camera Plugin Example</h2>
      
      <div className="controls">
        <button 
          onClick={handleRecordStory}
          disabled={isRecording}
          className="record-button"
        >
          {isRecording ? 'Recording...' : 'Record Story (15s)'}
        </button>
        
        <button 
          onClick={handleRecordLongVideo}
          disabled={isRecording}
          className="record-button"
        >
          {isRecording ? 'Recording...' : 'Record Long Video (60s)'}
        </button>
        
        <button 
          onClick={handleAddTextOverlay}
          disabled={!isRecording}
          className="overlay-button"
        >
          Add Text Overlay
        </button>
        
        <button 
          onClick={handleAddEmojiOverlay}
          disabled={!isRecording}
          className="overlay-button"
        >
          Add Emoji Overlay
        </button>
        
        <button 
          onClick={handleAddFilterOverlay}
          disabled={!isRecording}
          className="overlay-button"
        >
          Add Warm Filter
        </button>
      </div>
      
      {recordedVideo && (
        <div className="result">
          <h3>Recorded Video:</h3>
          <p><strong>File Path:</strong> {recordedVideo.filePath}</p>
          <p><strong>Thumbnail:</strong> {recordedVideo.thumbnailPath}</p>
          <p><strong>Duration:</strong> {recordedVideo.duration}s</p>
          <p><strong>Size:</strong> {(recordedVideo.size / 1024 / 1024).toFixed(2)}MB</p>
          <p><strong>Camera:</strong> {recordedVideo.camera}</p>
          <p><strong>Overlays:</strong> {recordedVideo.overlays.join(', ') || 'None'}</p>
        </div>
      )}
    </div>
  );
};

// Example integration with existing Velyar components
export const integrateWithVelyar = () => {
  // This would be integrated into the existing VideoCreate.tsx component
  const handleStoryCameraRecord = async () => {
    try {
      const result = await StoryCameraService.recordStoryVideo();
      
      // Upload to Supabase or process the video
      const videoFile = result.filePath;
      const thumbnailFile = result.thumbnailPath;
      
      // Process with existing video upload logic
      // await uploadVideo(videoFile, thumbnailFile, result);
      
      console.log('Video processed and uploaded successfully');
    } catch (error) {
      console.error('Failed to process video:', error);
    }
  };

  return handleStoryCameraRecord;
};
