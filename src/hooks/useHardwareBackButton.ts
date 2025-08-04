import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const useHardwareBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

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
    let removeListener: (() => void) | undefined;
    
    App.addListener('backButton', handleBackButton).then((listener) => {
      removeListener = () => listener.remove();
    });

    return () => {
      removeListener?.();
    };
  }, [navigate, location.pathname]);
};
