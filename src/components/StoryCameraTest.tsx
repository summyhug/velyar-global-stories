import React, { useState } from 'react';
import StoryCamera, { RecordVideoOptions, RecordVideoResult } from '../plugins/StoryCamera';

/**
 * Isolated test component for StoryCamera plugin
 * This can be easily added/removed from your app for testing
 */
export const StoryCameraTest: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<RecordVideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRecordVideo = async (options?: RecordVideoOptions) => {
    try {
      setIsLoading(true);
      setError(null);
      setIsRecording(true);
      
      console.log('Starting video recording with options:', options);
      const result = await StoryCamera.recordVideo(options);
      
      console.log('Video recorded successfully:', result);
      setRecordedVideo(result);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Recording failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRecording(false);
    }
  };

  const handleRecordStory = () => {
    handleRecordVideo({
      duration: 15,
      camera: 'front',
      allowOverlays: true
    });
  };

  const handleRecordLongVideo = () => {
    handleRecordVideo({
      duration: 30,
      camera: 'rear',
      allowOverlays: true
    });
  };

  const handleRecordDefault = () => {
    handleRecordVideo();
  };

  const clearResults = () => {
    setRecordedVideo(null);
    setError(null);
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">StoryCamera Plugin Test</h2>
      
      {/* Test Controls */}
      <div className="space-y-3 mb-6">
        <button
          onClick={handleRecordStory}
          disabled={isLoading || isRecording}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {isLoading ? 'Loading...' : isRecording ? 'Recording...' : 'Record Story (15s, Front)'}
        </button>
        
        <button
          onClick={handleRecordLongVideo}
          disabled={isLoading || isRecording}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {isLoading ? 'Loading...' : isRecording ? 'Recording...' : 'Record Long Video (30s, Rear)'}
        </button>
        
        <button
          onClick={handleRecordDefault}
          disabled={isLoading || isRecording}
          className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {isLoading ? 'Loading...' : isRecording ? 'Recording...' : 'Record Default (30s, Rear)'}
        </button>
        
        <button
          onClick={clearResults}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Clear Results
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Display */}
      {recordedVideo && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Recorded Video:</h3>
          
          <div className="space-y-2 text-sm">
            <div>
              <strong>File Path:</strong>
              <div className="text-gray-600 break-all">{recordedVideo.filePath}</div>
            </div>
            
            <div>
              <strong>Thumbnail:</strong>
              <div className="text-gray-600 break-all">{recordedVideo.thumbnailPath}</div>
            </div>
            
            <div>
              <strong>Duration:</strong> {recordedVideo.duration.toFixed(2)}s
            </div>
            
            <div>
              <strong>Size:</strong> {(recordedVideo.size / 1024 / 1024).toFixed(2)}MB
            </div>
            
            <div>
              <strong>Camera:</strong> {recordedVideo.camera}
            </div>
            
            <div>
              <strong>Overlays:</strong>
              <div className="text-gray-600">
                {recordedVideo.overlays.length > 0 
                  ? recordedVideo.overlays.join(', ')
                  : 'None'
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plugin Status */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <div className="text-sm text-blue-800">
          <strong>Plugin Status:</strong> {StoryCamera ? '✅ Loaded' : '❌ Not Available'}
        </div>
        <div className="text-xs text-blue-600 mt-1">
          This is a test component. Remove it when testing is complete.
        </div>
      </div>
    </div>
  );
};
