import React from "react";

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
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Header - positioned outside scroll container for proper sticky behavior */}
      {header && (
        <div className="sticky-header">
          {header}
        </div>
      )}
      
      {/* Main content area - NO top safe area padding here */}
      <main className={`${showBottomNav ? 'content-safe-bottom' : ''}`}>
        {children}
      </main>
    </div>
  );
};
