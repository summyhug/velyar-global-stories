import { registerPlugin, Capacitor } from '@capacitor/core';

export interface RecordVideoOptions {
  duration?: number; // max seconds, default 30
  camera?: 'front' | 'rear'; // default rear
  allowOverlays?: boolean; // default true
  promptName?: string; // test parameter to verify communication
  contextType?: 'mission' | 'daily'; // context for video assignment
  missionId?: string; // mission ID if contextType is 'mission'
  promptId?: string; // prompt ID if contextType is 'daily'
}

export interface RecordVideoResult {
  filePath: string;
  thumbnailPath?: string;
  duration?: number;
  size?: number;
  camera?: 'front' | 'rear';
  overlays?: string[];
  contextType?: 'mission' | 'daily'; // echoed back context
  missionId?: string; // echoed back mission ID
  promptId?: string; // echoed back prompt ID
}

export interface StoryCameraPlugin {
  recordVideo(options?: RecordVideoOptions): Promise<RecordVideoResult>;
  getVideoData(): Promise<{ hasVideo: boolean; filePath?: string }>;
  ping?(): Promise<void>;
}

const StoryCamera = registerPlugin<StoryCameraPlugin>('StoryCamera');

export default StoryCamera;
