import { useState, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Device } from '@capacitor/device';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Geolocation } from '@capacitor/geolocation';
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
      const video = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      
      return video.webPath;
    } catch (error) {
      console.error('Video recording error:', error);
      throw error;
    }
  };

  const getCurrentLocation = async () => {
    try {
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