# StoryCamera Plugin

A custom Instagram/TikTok-style in-app video recorder for Capacitor applications, specifically designed for the Velyar app.

## Features

- **Custom Camera Interface**: Full-screen camera preview with dark mode design
- **Dual Camera Support**: Switch between front and rear cameras
- **Configurable Recording**: Set maximum duration (default: 30 seconds)
- **Overlay Support**: Add text captions, emojis, stickers, and filters
- **Automatic Compression**: Compress videos larger than 50MB
- **Thumbnail Generation**: Automatic thumbnail creation
- **Metadata Return**: Complete video information including file paths, duration, size, and overlays
- **Cross-Platform**: Works on both iOS (AVFoundation) and Android (CameraX)

## Installation

### 1. Add the plugin to your project

```bash
npm install @velyar/story-camera-plugin
```

### 2. Add to your Capacitor configuration

In your `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ... other config
  plugins: {
    // ... other plugins
    StoryCamera: {
      permissions: {
        camera: "Camera access is required to record videos for stories.",
        microphone: "Microphone access is required to record audio for videos."
      }
    }
  }
};

export default config;
```

### 3. Sync your project

```bash
npx cap sync
```

## Usage

### Basic Usage

```typescript
import StoryCamera from '@velyar/story-camera-plugin';

// Record a video with default settings
const result = await StoryCamera.recordVideo();

console.log('Video recorded:', result);
// {
//   filePath: '/path/to/video.mp4',
//   thumbnailPath: '/path/to/thumbnail.jpg',
//   duration: 15.5,
//   size: 2048576,
//   camera: 'rear',
//   overlays: []
// }
```

### Advanced Usage

```typescript
import StoryCamera, { RecordVideoOptions } from '@velyar/story-camera-plugin';

const options: RecordVideoOptions = {
  duration: 60, // 60 seconds max
  camera: 'front', // Use front camera
  allowOverlays: true // Enable overlays
};

const result = await StoryCamera.recordVideo(options);
```

### Adding Overlays

```typescript
// Add text overlay
await StoryCamera.addOverlay({
  type: 'text',
  data: 'Hello World!'
});

// Add emoji overlay
await StoryCamera.addOverlay({
  type: 'emoji',
  data: '😊'
});

// Add filter overlay
await StoryCamera.addOverlay({
  type: 'filter',
  data: 'grayscale'
});
```

## API Reference

### `recordVideo(options?: RecordVideoOptions): Promise<RecordVideoResult>`

Records a video with the specified options.

#### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `duration` | `number` | `30` | Maximum recording duration in seconds |
| `camera` | `'front' \| 'rear'` | `'rear'` | Camera to use for recording |
| `allowOverlays` | `boolean` | `true` | Whether to allow overlays |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `filePath` | `string` | Path to the recorded video file |
| `thumbnailPath` | `string` | Path to the generated thumbnail |
| `duration` | `number` | Duration of the video in seconds |
| `size` | `number` | File size in bytes |
| `camera` | `'front' \| 'rear'` | Camera used for recording |
| `overlays` | `string[]` | Array of applied overlays |

### `addOverlay(options: OverlayOptions): Promise<void>`

Adds an overlay to the current recording session.

#### Overlay Options

| Property | Type | Description |
|----------|------|-------------|
| `type` | `string` | Type of overlay ('text', 'emoji', 'filter', 'sticker') |
| `data` | `string` | Overlay data (text content, emoji, filter name, etc.) |

### `switchCamera(): Promise<void>`

Switches between front and rear cameras.

### `cancelRecording(): Promise<void>`

Cancels the current recording and discards the video.

## Platform-Specific Notes

### iOS

- Uses AVFoundation framework
- Requires camera and microphone permissions
- Supports all iOS 13.0+ devices
- Automatic video compression using AVAssetExportSession

### Android

- Uses CameraX API
- Requires camera and storage permissions
- Supports Android API level 21+
- Automatic video compression using MediaCodec

## Permissions

The plugin requires the following permissions:

### iOS
- `NSCameraUsageDescription` - Camera access
- `NSMicrophoneUsageDescription` - Microphone access
- `NSPhotoLibraryUsageDescription` - Photo library access

### Android
- `android.permission.CAMERA` - Camera access
- `android.permission.RECORD_AUDIO` - Audio recording
- `android.permission.WRITE_EXTERNAL_STORAGE` - File storage
- `android.permission.READ_EXTERNAL_STORAGE` - File reading

## Error Handling

The plugin may throw errors in the following scenarios:

- Camera permission denied
- Camera not available
- Recording failed
- File system errors
- Memory issues

```typescript
try {
  const result = await StoryCamera.recordVideo();
  // Handle success
} catch (error) {
  console.error('Recording failed:', error.message);
  // Handle error
}
```

## Customization

### UI Customization

The camera interface can be customized by modifying the native code:

- **iOS**: Edit `StoryCameraViewController.swift`
- **Android**: Edit `StoryCameraPlugin.kt`

### Video Quality

Video quality can be adjusted in the native implementations:

- **iOS**: Modify `sessionPreset` in `AVCaptureSession`
- **Android**: Modify `QualitySelector` in CameraX

### Compression Settings

Video compression settings can be customized:

- **iOS**: Modify `AVAssetExportSession` settings
- **Android**: Modify `MediaCodec` parameters

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
