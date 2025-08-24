import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Film, User } from "lucide-react";

export const BottomNav = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/10 pb-safe">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-around">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive("/") 
                ? "text-velyar-earth bg-velyar-soft" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-ui">Home</span>
          </Link>

          <Link
            to="/explore"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive("/explore") 
                ? "text-velyar-earth bg-velyar-soft" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-xs font-ui">Explore</span>
          </Link>

          <Link
            to="/missions"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive("/missions") 
                ? "text-velyar-earth bg-velyar-soft" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Film className="w-5 h-5" />
            <span className="text-xs font-ui">Missions</span>
          </Link>

          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive("/profile") 
                ? "text-velyar-earth bg-velyar-soft" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-ui">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};