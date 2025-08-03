import { Home, Compass, Film, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

export const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: "home", path: "/" },
    { icon: Compass, label: "explore", path: "/explore" },
    { icon: Film, label: "missions", path: "/missions" },
    { icon: User, label: "profile", path: "/profile" },
  ];

  return (
    <nav className="bottom-nav">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-velyar-earth bg-velyar-soft' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};