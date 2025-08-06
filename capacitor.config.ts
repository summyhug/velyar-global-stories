import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e717c17b39ea497bb3f0803db35e66f4',
  appName: 'velyar-global-stories',
  webDir: 'dist',
  // Remove server config for production APK builds - use local files instead
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#fffbf0',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK'
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Camera: {
      permissions: {
        camera: "Camera access is required to record videos and take photos."
      }
    },
    Geolocation: {
      permissions: {
        location: "Location access is required to tag your videos with location."
      }
    }
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;