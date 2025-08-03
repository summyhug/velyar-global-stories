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

  const recordVideo = async (): Promise<{ file: File; url: string }> => {
    console.log('useMobile: recordVideo called, isNative:', isNative);
    console.log('useMobile: Platform:', Capacitor.getPlatform());
    
    try {
      // For native platforms, use a custom video recording approach
      if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
        console.log('useMobile: Setting up video capture for native platform');
        
        // Create a promise that will resolve when the user selects a video
        return new Promise<{ file: File; url: string }>((resolve, reject) => {
          // Create a temporary input element for video capture
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'video/*';
          input.capture = 'environment'; // Use rear camera by default
          input.style.display = 'none';
          
          console.log('useMobile: Created file input element');
          
          let resolved = false;
          
          input.onchange = (event) => {
            if (resolved) return;
            console.log('useMobile: File input change event triggered');
            
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
              console.log('useMobile: File selected:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
              });
              
              // Return both the file and blob URL
              const url = URL.createObjectURL(file);
              console.log('useMobile: Created blob URL:', url);
              
              resolved = true;
              resolve({ file, url });
            } else {
              console.log('useMobile: No file selected in change event');
              resolved = true;
              reject(new Error('No video selected'));
            }
            
            // Clean up
            try {
              document.body.removeChild(input);
            } catch (e) {
              console.log('useMobile: Input already removed or not in DOM');
            }
          };
          
          input.oncancel = () => {
            if (resolved) return;
            console.log('useMobile: File input cancelled');
            resolved = true;
            reject(new Error('Video recording cancelled'));
            
            try {
              document.body.removeChild(input);
            } catch (e) {
              console.log('useMobile: Input already removed or not in DOM');
            }
          };
          
          // Handle cases where the input doesn't trigger events properly
          input.onerror = () => {
            if (resolved) return;
            console.log('useMobile: File input error');
            resolved = true;
            reject(new Error('Video recording failed'));
            
            try {
              document.body.removeChild(input);
            } catch (e) {
              console.log('useMobile: Input already removed or not in DOM');
            }
          };
          
          document.body.appendChild(input);
          console.log('useMobile: Added input to DOM');
          
          // Add a small delay and then trigger the click
          setTimeout(() => {
            console.log('useMobile: Triggering file input click');
            try {
              input.click();
            } catch (error) {
              console.error('useMobile: Error clicking input:', error);
              if (!resolved) {
                resolved = true;
                reject(new Error('Failed to open video recorder'));
              }
            }
          }, 100);
          
          // Timeout handler
          setTimeout(() => {
            if (!resolved) {
              console.log('useMobile: Video recording timeout after 60 seconds');
              resolved = true;
              reject(new Error('Video recording timeout'));
              try {
                document.body.removeChild(input);
              } catch (e) {
                console.log('useMobile: Input already removed or not in DOM');
              }
            }
          }, 60000); // 60 second timeout
        });
      } else {
        throw new Error('Video recording not supported on this platform');
      }
    } catch (error) {
      console.error('useMobile: Video recording error:', error);
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