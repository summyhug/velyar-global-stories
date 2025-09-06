import { registerPlugin, Capacitor } from '@capacitor/core';

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
console.log('🔧 ===== REGISTERING STORYCAMERA PLUGIN =====');
console.log('🔧 About to register StoryCamera plugin...');
console.log('🔧 Capacitor platform:', typeof Capacitor !== 'undefined' ? Capacitor.getPlatform() : 'Capacitor not available');
console.log('🔧 Capacitor isNativePlatform:', typeof Capacitor !== 'undefined' ? Capacitor.isNativePlatform() : 'Capacitor not available');

const StoryCamera = registerPlugin<StoryCameraPlugin>('StoryCamera');

console.log('📱 ===== STORYCAMERA PLUGIN REGISTERED =====');
console.log('📱 StoryCamera plugin registered:', StoryCamera);
console.log('📱 StoryCamera.recordVideo method:', StoryCamera.recordVideo);
console.log('📱 StoryCamera.recordVideo type:', typeof StoryCamera.recordVideo);
console.log('📱 StoryCamera keys:', Object.keys(StoryCamera));
console.log('📱 StoryCamera constructor:', StoryCamera.constructor.name);

export default StoryCamera;
