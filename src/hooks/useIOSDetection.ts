import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const useIOSDetection = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [iOSVersion, setIOSVersion] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    const detectIOS = async () => {
      // Check if we're on native iOS platform
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
        setIsIOS(true);
        console.log('🍎 iOS detected - applying overscroll fix');
        
        // Apply iOS overscroll fix
        document.body.classList.add('ios-overscroll-fix');
        
        // Additional fix for root element
        const root = document.getElementById('root');
        if (root) {
          root.style.overscrollBehavior = 'none';
          root.style.overscrollBehaviorY = 'none';
          root.style.overscrollBehaviorX = 'none';
          root.style.webkitOverflowScrolling = 'touch';
        }
        
        // Also fix body overscroll
        document.body.style.overscrollBehavior = 'none';
        document.body.style.webkitOverflowScrolling = 'auto';
        
        console.log('✅ iOS overscroll fix applied');
        
        try {
          // Dynamic import for iOS-specific device info
          const { Device } = await import('@capacitor/device');
          const info = await Device.getInfo();
          setDeviceInfo(info);
          setIOSVersion(info.osVersion);
          
          // Set iOS-specific status bar
          const { StatusBar, Style } = await import('@capacitor/status-bar');
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#fffbf0' });
        } catch (error) {
          console.error('iOS detection error:', error);
        }
      } else {
        setIsIOS(false);
        console.log('📱 Non-iOS platform detected:', Capacitor.getPlatform());
        
        // Remove iOS overscroll fix for non-iOS platforms
        document.body.classList.remove('ios-overscroll-fix');
        
        // Reset root element styles
        const root = document.getElementById('root');
        if (root) {
          root.style.overscrollBehavior = '';
          root.style.overscrollBehaviorY = '';
          root.style.overscrollBehaviorX = '';
          root.style.webkitOverflowScrolling = '';
        }
        
        // Reset body styles
        document.body.style.overscrollBehavior = '';
        document.body.style.webkitOverflowScrolling = '';
      }
    };

    detectIOS();
    
    // Cleanup function to remove the class when component unmounts
    return () => {
      document.body.classList.remove('ios-overscroll-fix');
      
      // Reset root element styles
      const root = document.getElementById('root');
      if (root) {
        root.style.overscrollBehavior = '';
        root.style.overscrollBehaviorY = '';
        root.style.overscrollBehaviorX = '';
        root.style.webkitOverflowScrolling = '';
      }
      
      // Reset body styles
      document.body.style.overscrollBehavior = '';
      document.body.style.webkitOverflowScrolling = '';
    };
  }, []);

  const handleIOSSpecificFeatures = async () => {
    if (!isIOS) return;

    try {
      // Handle iOS-specific keyboard behavior
      const { Keyboard } = await import('@capacitor/keyboard');
      
      // Listen for keyboard events
      await Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.transform = `translateY(-${info.keyboardHeight / 2}px)`;
      });

      await Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.transform = 'translateY(0)';
      });

      // Handle iOS haptic feedback
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      return {
        lightHaptic: () => Haptics.impact({ style: ImpactStyle.Light }),
        mediumHaptic: () => Haptics.impact({ style: ImpactStyle.Medium }),
        heavyHaptic: () => Haptics.impact({ style: ImpactStyle.Heavy }),
        selectionHaptic: () => Haptics.selectionStart(),
      };
    } catch (error) {
      console.error('iOS features setup error:', error);
      return null;
    }
  };

  return {
    isIOS,
    iOSVersion,
    deviceInfo,
    handleIOSSpecificFeatures,
  };
};