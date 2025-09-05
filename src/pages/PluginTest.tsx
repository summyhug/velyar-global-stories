import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera } from 'lucide-react';
import StoryCamera from '../plugins/StoryCamera';

export const PluginTest: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testPlugin = async () => {
    try {
      setIsRecording(true);
      setError(null);
      setResult(null);

      console.log('🧪 Testing StoryCamera plugin...');
      const pluginResult = await StoryCamera.recordVideo({
        duration: 10,
        camera: 'front',
        allowOverlays: true
      });

      console.log('✅ Plugin test successful:', pluginResult);
      setResult(pluginResult);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Plugin test failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            StoryCamera Plugin Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testPlugin}
            disabled={isRecording}
            className="w-full"
            size="lg"
          >
            {isRecording ? 'Testing...' : 'Test StoryCamera Plugin'}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800">Success!</h3>
              <div className="mt-2 space-y-1 text-sm text-green-700">
                <p><strong>Duration:</strong> {result.duration.toFixed(1)}s</p>
                <p><strong>Size:</strong> {(result.size / 1024 / 1024).toFixed(2)}MB</p>
                <p><strong>Camera:</strong> {result.camera}</p>
                <p><strong>Overlays:</strong> {result.overlays.length}</p>
                <p><strong>File Path:</strong> {result.filePath}</p>
                <p><strong>Thumbnail:</strong> {result.thumbnailPath}</p>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800">Test Instructions</h3>
            <ol className="mt-2 text-sm text-blue-700 space-y-1">
              <li>1. Click the "Test StoryCamera Plugin" button</li>
              <li>2. Allow camera permissions when prompted</li>
              <li>3. Wait for the test to complete</li>
              <li>4. Check the results above</li>
              <li>5. Check browser console for detailed logs</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
