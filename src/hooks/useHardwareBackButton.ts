import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Only import Capacitor modules in native environment
let App: any;
let Capacitor: any;

if (typeof window !== 'undefined' && window.Capacitor) {
  App = require('@capacitor/app').App;
  Capacitor = require('@capacitor/core').Capacitor;
}

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
