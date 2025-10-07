import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_EMAIL = 'sumit@velyar.com';

export function AdminGate() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen-safe bg-background font-quicksand flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-foreground font-nunito">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Check if user is admin
  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen-safe bg-background font-quicksand flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold font-nunito mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            This page is restricted to administrators only.
          </p>
          <a 
            href="/" 
            className="text-velyar-earth hover:underline font-medium"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // Render admin content
  return <Outlet />;
}

