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
          // Try to get safe area from CSS variables first
          const top = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top')) || 24;
          const bottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')) || 34;
          const left = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left')) || 0;
          const right = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right')) || 0;
          
          setInsets({ top, bottom, left, right });
        } catch (error) {
          console.warn('SafeArea values not available, using fallback');
          // Fallback values for common devices
          setInsets({
            top: 24,
            bottom: 34,
            left: 0,
            right: 0
          });
        }
      } else {
        // Web fallback - no safe area needed
        setInsets({
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        });
      }
    };

    initializeSafeArea();
  }, []);

  return insets;
};
