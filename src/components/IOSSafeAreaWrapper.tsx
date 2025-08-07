import { ReactNode } from 'react';
import { useIOSDetection } from '@/hooks/useIOSDetection';

interface IOSSafeAreaWrapperProps {
  children: ReactNode;
  className?: string;
}

export const IOSSafeAreaWrapper = ({ children, className = '' }: IOSSafeAreaWrapperProps) => {
  const { isIOS } = useIOSDetection();

  return (
    <div 
      className={`
        ${isIOS ? 'safe-area-inset' : 'pb-20'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};