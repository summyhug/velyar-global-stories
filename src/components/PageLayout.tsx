import React from "react";
import { Capacitor } from "@capacitor/core";

interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  header,
  showBottomNav = true,
  className = ""
}) => {
  // Android WebView calculates 100vh incorrectly, causing extra bottom space
  // Only use min-h-screen on iOS and web
  const platform = Capacitor.getPlatform();
  const shouldUseMinHeight = platform !== 'android';

  return (
    <div className={`${shouldUseMinHeight ? 'min-h-screen' : ''} bg-background ${className}`}>
      {/* Header - positioned outside scroll container for proper sticky behavior */}
      {header && (
        <div className="sticky-header">
          {header}
        </div>
      )}

      {/* Main content area - NO top safe area padding here */}
      <main className={`${showBottomNav ? 'content-safe-bottom' : 'pb-safe-bottom'}`}>
        {children}
      </main>
    </div>
  );
};
