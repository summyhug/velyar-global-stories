import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AuthGate() {
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

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Render protected content
  return <Outlet />;
}
