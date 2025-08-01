
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
import { BottomNav } from "./components/BottomNav";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <div className="relative">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/missions" element={<Missions />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/contributions" element={<Contributions />} />
              <Route path="/create" element={<VideoCreate />} />
              <Route path="/admin/prompts" element={<AdminPrompts />} />
              <Route path="/video-list/:type/:id?" element={<VideoList />} />
              <Route path="/videos/:type/:id?" element={<Videos />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </div>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
