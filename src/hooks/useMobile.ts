import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const useMobile = () => {
  const [isNative, setIsNative] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    
    if (Capacitor.isNativePlatform()) {
      initializeMobile();
    }
  }, []);

  const initializeMobile = async () => {
    try {
      // Dynamic imports for native platform only
      const { Device } = await import('@capacitor/device');
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      
      // Get device info
      const info = await Device.getInfo();
      setDeviceInfo(info);

      // Set status bar style
      await StatusBar.setStyle({ style: Style.Default });
      await StatusBar.setBackgroundColor({ color: '#fffbf0' });
    } catch (error) {
      console.error('Mobile initialization error:', error);
    }
  };

  const takePhoto = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Camera not available on web platform');
      }
      
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      
      return image.webPath;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  };

  const recordVideo = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Video recording not available on web platform');
      }
      
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const video = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      
      // Convert the video URI to a File object
      const response = await fetch(video.webPath!);
      const blob = await response.blob();
      const file = new File([blob], `video_${Date.now()}.mp4`, { type: 'video/mp4' });
      
      return {
        file: file,
        url: video.webPath!
      };
    } catch (error) {
      console.error('Video recording error:', error);
      throw error;
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Geolocation not available on web platform');
      }
      
      const { Geolocation } = await import('@capacitor/geolocation');
      const coordinates = await Geolocation.getCurrentPosition();
      return {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };
    } catch (error) {
      console.error('Location error:', error);
      throw error;
    }
  };

  const saveFile = async (data: string, fileName: string) => {
    try {
      if (!Capacitor.isNativePlatform()) {
        throw new Error('File system not available on web platform');
      }
      
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      return true;
    } catch (error) {
      console.error('File save error:', error);
      return false;
    }
  };

  const readFile = async (fileName: string) => {
    try {
      if (!Capacitor.isNativePlatform()) {
        throw new Error('File system not available on web platform');
      }
      
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      const contents = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      return contents.data;
    } catch (error) {
      console.error('File read error:', error);
      return null;
    }
  };

  return {
    isNative,
    deviceInfo,
    takePhoto,
    recordVideo,
    getCurrentLocation,
    saveFile,
    readFile
  };
};