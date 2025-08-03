import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e717c17b39ea497bb3f0803db35e66f4',
  appName: 'velyar-global-stories',
  webDir: 'dist',
  server: {
    url: 'https://e717c17b-39ea-497b-b3f0-803db35e66f4.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#fffbf0',
      showSpinner: false
    }
  }
};

export default config;