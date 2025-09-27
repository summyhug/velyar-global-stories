import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e717c17b39ea497bb3f0803db35e66f4',
  appName: 'Velyar',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#fffbf0',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      iosSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#fffbf0'
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Camera: {
      permissions: {
        camera: "Camera access is required to record videos and take photos."
      }
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    SafeArea: {
      backgroundColor: '#fffbf0'
    },
    StoryCamera: {
      permissions: {
        camera: "Camera access is required to record videos."
      }
    }
  },
  ios: {
    appId: 'com.velyar.app',
    contentInset: 'automatic',
    allowsLinkPreview: false,
    handleApplicationNotifications: false,
    backgroundColor: '#fffbf0',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
    swipeBackEnabled: true,
    keyboardDisplayRequiresUserAction: false,
    suppressesIncrementalRendering: false
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#fffbf0',
    loggingBehavior: 'production',
    webContentsDebuggingEnabled: false
  }
};

export default config;