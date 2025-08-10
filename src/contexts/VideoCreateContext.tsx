import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VideoCreateContextType {
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}

const VideoCreateContext = createContext<VideoCreateContextType | undefined>(undefined);

export const useVideoCreate = () => {
  const context = useContext(VideoCreateContext);
  if (context === undefined) {
    throw new Error('useVideoCreate must be used within a VideoCreateProvider');
  }
  return context;
};

interface VideoCreateProviderProps {
  children: ReactNode;
}

export const VideoCreateProvider: React.FC<VideoCreateProviderProps> = ({ children }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <VideoCreateContext.Provider value={{ isEditing, setIsEditing }}>
      {children}
    </VideoCreateContext.Provider>
  );
};
