import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

export const useHardwareBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initializeBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        const handleBackButton = () => {
          // If we're on the home page, exit the app
          if (location.pathname === '/' || location.pathname === '/home') {
            App.exitApp();
            return;
          }

          // Otherwise, navigate back
          navigate(-1);
        };

        // Add listener for hardware back button
        const listener = await App.addListener('backButton', handleBackButton);
        
        return () => {
          listener.remove();
        };
      } catch (error) {
        console.error('Failed to initialize hardware back button:', error);
      }
    };

    let cleanup: (() => void) | undefined;
    initializeBackButton().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
    };
  }, [navigate, location.pathname]);
};
