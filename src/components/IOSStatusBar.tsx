import { useEffect } from 'react';
import { useIOSDetection } from '@/hooks/useIOSDetection';
import { useTheme } from '@/contexts/ThemeContext';

export const IOSStatusBar = () => {
  const { isIOS } = useIOSDetection();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!isIOS) return;

    const setIOSStatusBar = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');

        // Prevent status bar from overlaying web view and being tappable
        // This fixes the issue where tapping status bar pushes content down
        await StatusBar.setOverlaysWebView({ overlay: false });

        // Set status bar style based on theme
        // Light mode: Dark style (dark text/icons) with light background
        // Dark mode: Light style (light text/icons) with dark background
        if (resolvedTheme === 'dark') {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#1a1a1a' }); // Dark background
        } else {
          // Light mode: Using Dark style to ensure dark text/icons (closest to velyar blue #285A66)
          // Note: iOS only supports black (Dark) or white (Light) - custom colors require native implementation
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#fffbf0' }); // Light beige background
        }

        // Show status bar
        await StatusBar.show();
      } catch (error) {
        console.error('iOS StatusBar setup error:', error);
      }
    };

    setIOSStatusBar();
  }, [isIOS, resolvedTheme]);

  // This component doesn't render anything visible
  return null;
};