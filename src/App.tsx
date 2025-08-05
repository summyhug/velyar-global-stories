
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import Missions from "./pages/Missions";
import Profile from "./pages/Profile";
import Contributions from "./pages/Contributions";
import VideoCreate from "./pages/VideoCreate";
import Videos from "./pages/Videos";
import VideoList from "./pages/VideoList";
import NotFound from "./pages/NotFound";
import AdminPrompts from "./pages/AdminPrompts";
import AdminMissions from "./pages/AdminMissions";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { BottomNav } from "./components/BottomNav";
import { useLocation } from "react-router-dom";
import { useHardwareBackButton } from "./hooks/useHardwareBackButton";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  useHardwareBackButton();
  
  const hideBottomNav = ['/auth', '/terms', '/privacy'].includes(location.pathname) || location.pathname.startsWith('/videos/');

  return (
    <div className="relative">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/contributions" element={<Contributions />} />
        <Route path="/create" element={<VideoCreate />} />
        <Route path="/create/mission/:missionId" element={<VideoCreate />} />
        <Route path="/create/daily-prompt" element={<VideoCreate />} />
        <Route path="/admin/prompts" element={<AdminPrompts />} />
        <Route path="/admin/missions" element={<AdminMissions />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/video-list/:type/:id?" element={<VideoList />} />
        <Route path="/videos/:type/:id?" element={<Videos />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <AppContent />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
