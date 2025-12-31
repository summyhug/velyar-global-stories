import { useEffect } from 'react';
import { useIOSDetection } from '@/hooks/useIOSDetection';

export const IOSStatusBar = () => {
  const { isIOS } = useIOSDetection();

  useEffect(() => {
    if (!isIOS) return;

    const setIOSStatusBar = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');

        // Prevent status bar from overlaying web view and being tappable
        // This fixes the issue where tapping status bar pushes content down
        await StatusBar.setOverlaysWebView({ overlay: false });

        // Set status bar style for iOS
        // FIX: Using Dark style to ensure dark text/icons (closest to velyar blue #285A66)
        // Note: iOS only supports black (Dark) or white (Light) - custom colors require native implementation
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#fffbf0' });

        // Show status bar
        await StatusBar.show();
      } catch (error) {
        console.error('iOS StatusBar setup error:', error);
      }
    };

    setIOSStatusBar();
  }, [isIOS]);

  // This component doesn't render anything visible
  return null;
};