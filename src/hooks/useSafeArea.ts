import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const useSafeArea = () => {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const initializeSafeArea = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Dynamically import the SafeArea plugin
          const { SafeArea } = await import('@capacitor-community/safe-area');
          
          // Get the current insets
          const result = await SafeArea.getSafeAreaInsets();
          setInsets(result.insets);
          
          // Listen for changes (e.g., rotation, keyboard)
          SafeArea.addListener('safeAreaChanged', (event) => {
            setInsets(event.insets);
          });
        } catch (error) {
          console.warn('SafeArea plugin not available, using fallback values');
          // Fallback values for common devices
          setInsets({
            top: 24, // Common status bar height
            bottom: 34, // Common navigation bar height
            left: 0,
            right: 0
          });
        }
      } else {
        // Web fallback - use CSS env() variables
        const getCSSVariable = (name: string): number => {
          const value = getComputedStyle(document.documentElement)
            .getPropertyValue(name)
            .trim();
          return value ? parseInt(value) : 0;
        };

        setInsets({
          top: getCSSVariable('--ion-safe-area-top') || 0,
          bottom: getCSSVariable('--ion-safe-area-bottom') || 0,
          left: getCSSVariable('--ion-safe-area-left') || 0,
          right: getCSSVariable('--ion-safe-area-right') || 0
        });
      }
    };

    initializeSafeArea();
  }, []);

  return insets;
};
