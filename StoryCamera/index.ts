import { registerPlugin } from '@capacitor/core';
import webFallback from './web-fallback';

export interface RecordVideoOptions {
  duration?: number; // max seconds, default 30
  camera?: 'front' | 'rear'; // default rear
  allowOverlays?: boolean; // default true
}

export interface RecordVideoResult {
  filePath: string;
  thumbnailPath?: string;
  duration?: number;
  size?: number;
  camera?: 'front' | 'rear';
  overlays?: string[];
}

export interface StoryCameraPlugin {
  recordVideo(options?: RecordVideoOptions): Promise<RecordVideoResult>;
  ping?(): Promise<void>;
}

// Try to register the native plugin, fallback to web implementation
let StoryCamera: StoryCameraPlugin;
try {
  StoryCamera = registerPlugin<StoryCameraPlugin>('StoryCamera');
  console.log('📱 Native StoryCamera plugin registered');
} catch (error) {
  console.log('🌐 Using web fallback for StoryCamera plugin');
  StoryCamera = webFallback as StoryCameraPlugin;
}

export default StoryCamera;
