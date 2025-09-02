import StoryCamera, { RecordVideoOptions, RecordVideoResult } from '../index';

// Mock the native plugin for testing
jest.mock('../index', () => ({
  recordVideo: jest.fn(),
  addOverlay: jest.fn(),
  switchCamera: jest.fn(),
  cancelRecording: jest.fn(),
}));

describe('StoryCamera Plugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordVideo', () => {
    it('should call recordVideo with default options', async () => {
      const mockResult: RecordVideoResult = {
        filePath: '/path/to/video.mp4',
        thumbnailPath: '/path/to/thumbnail.jpg',
        duration: 15.5,
        size: 2048576,
        camera: 'rear',
        overlays: []
      };

      (StoryCamera.recordVideo as jest.Mock).mockResolvedValue(mockResult);

      const result = await StoryCamera.recordVideo();

      expect(StoryCamera.recordVideo).toHaveBeenCalledWith();
      expect(result).toEqual(mockResult);
    });

    it('should call recordVideo with custom options', async () => {
      const options: RecordVideoOptions = {
        duration: 60,
        camera: 'front',
        allowOverlays: true
      };

      const mockResult: RecordVideoResult = {
        filePath: '/path/to/video.mp4',
        thumbnailPath: '/path/to/thumbnail.jpg',
        duration: 45.2,
        size: 5123456,
        camera: 'front',
        overlays: ['text:Hello World', 'emoji:😊']
      };

      (StoryCamera.recordVideo as jest.Mock).mockResolvedValue(mockResult);

      const result = await StoryCamera.recordVideo(options);

      expect(StoryCamera.recordVideo).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockResult);
    });

    it('should handle recording errors', async () => {
      const error = new Error('Camera permission denied');
      (StoryCamera.recordVideo as jest.Mock).mockRejectedValue(error);

      await expect(StoryCamera.recordVideo()).rejects.toThrow('Camera permission denied');
    });
  });

  describe('addOverlay', () => {
    it('should add text overlay', async () => {
      (StoryCamera.addOverlay as jest.Mock).mockResolvedValue(undefined);

      await StoryCamera.addOverlay({
        type: 'text',
        data: 'Hello World'
      });

      expect(StoryCamera.addOverlay).toHaveBeenCalledWith({
        type: 'text',
        data: 'Hello World'
      });
    });

    it('should add emoji overlay', async () => {
      (StoryCamera.addOverlay as jest.Mock).mockResolvedValue(undefined);

      await StoryCamera.addOverlay({
        type: 'emoji',
        data: '😊'
      });

      expect(StoryCamera.addOverlay).toHaveBeenCalledWith({
        type: 'emoji',
        data: '😊'
      });
    });

    it('should add filter overlay', async () => {
      (StoryCamera.addOverlay as jest.Mock).mockResolvedValue(undefined);

      await StoryCamera.addOverlay({
        type: 'filter',
        data: 'warm'
      });

      expect(StoryCamera.addOverlay).toHaveBeenCalledWith({
        type: 'filter',
        data: 'warm'
      });
    });
  });

  describe('switchCamera', () => {
    it('should switch camera successfully', async () => {
      (StoryCamera.switchCamera as jest.Mock).mockResolvedValue(undefined);

      await StoryCamera.switchCamera();

      expect(StoryCamera.switchCamera).toHaveBeenCalled();
    });
  });

  describe('cancelRecording', () => {
    it('should cancel recording successfully', async () => {
      (StoryCamera.cancelRecording as jest.Mock).mockResolvedValue(undefined);

      await StoryCamera.cancelRecording();

      expect(StoryCamera.cancelRecording).toHaveBeenCalled();
    });
  });
});

// Type validation tests
describe('Type Definitions', () => {
  it('should have correct RecordVideoOptions type', () => {
    const options: RecordVideoOptions = {
      duration: 30,
      camera: 'rear',
      allowOverlays: true
    };

    expect(options.duration).toBe(30);
    expect(options.camera).toBe('rear');
    expect(options.allowOverlays).toBe(true);
  });

  it('should have correct RecordVideoResult type', () => {
    const result: RecordVideoResult = {
      filePath: '/path/to/video.mp4',
      thumbnailPath: '/path/to/thumbnail.jpg',
      duration: 15.5,
      size: 2048576,
      camera: 'front',
      overlays: ['text:Hello', 'emoji:😊']
    };

    expect(typeof result.filePath).toBe('string');
    expect(typeof result.thumbnailPath).toBe('string');
    expect(typeof result.duration).toBe('number');
    expect(typeof result.size).toBe('number');
    expect(['front', 'rear']).toContain(result.camera);
    expect(Array.isArray(result.overlays)).toBe(true);
  });
});

// Integration test example
describe('Integration Tests', () => {
  it('should handle complete recording workflow', async () => {
    // Mock successful recording
    const mockResult: RecordVideoResult = {
      filePath: '/path/to/video.mp4',
      thumbnailPath: '/path/to/thumbnail.jpg',
      duration: 20.0,
      size: 3072000,
      camera: 'rear',
      overlays: []
    };

    (StoryCamera.recordVideo as jest.Mock).mockResolvedValue(mockResult);
    (StoryCamera.addOverlay as jest.Mock).mockResolvedValue(undefined);
    (StoryCamera.switchCamera as jest.Mock).mockResolvedValue(undefined);

    // Simulate recording workflow
    const options: RecordVideoOptions = {
      duration: 30,
      camera: 'rear',
      allowOverlays: true
    };

    // Start recording
    const result = await StoryCamera.recordVideo(options);

    // Add overlays during recording
    await StoryCamera.addOverlay({ type: 'text', data: 'Test Caption' });
    await StoryCamera.addOverlay({ type: 'emoji', data: '🎉' });

    // Switch camera
    await StoryCamera.switchCamera();

    // Verify results
    expect(result).toEqual(mockResult);
    expect(StoryCamera.addOverlay).toHaveBeenCalledTimes(2);
    expect(StoryCamera.switchCamera).toHaveBeenCalledTimes(1);
  });

  it('should handle recording cancellation', async () => {
    (StoryCamera.cancelRecording as jest.Mock).mockResolvedValue(undefined);

    // Simulate cancellation
    await StoryCamera.cancelRecording();

    expect(StoryCamera.cancelRecording).toHaveBeenCalled();
  });
});
