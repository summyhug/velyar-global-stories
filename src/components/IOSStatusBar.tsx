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