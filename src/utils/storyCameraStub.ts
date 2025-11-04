/**
 * Web stub for StoryCamera - prevents Vercel build failures
 * This is used only for web builds where StoryCamera native plugin isn't available
 */

export interface RecordVideoOptions {
  duration?: number;
  camera?: 'front' | 'rear';
  allowOverlays?: boolean;
  promptName?: string;
  contextType?: 'mission' | 'daily';
  missionId?: string;
  promptId?: string;
}

export interface RecordVideoResult {
  filePath: string;
  thumbnailPath?: string;
  duration?: number;
  size?: number;
  camera?: 'front' | 'rear';
  overlays?: string[];
  contextType?: 'mission' | 'daily';
  missionId?: string;
  promptId?: string;
}

// Web stub - will never be called in web/admin context
const webStub = {
  recordVideo: async (_options?: RecordVideoOptions): Promise<RecordVideoResult> => {
    throw new Error('StoryCamera is only available on native platforms');
  },
  getVideoData: async () => ({ hasVideo: false }),
  ping: async () => {},
};

export default webStub;

