
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { VideoCreateProvider } from "./contexts/VideoCreateContext";
import { Toaster } from "./components/ui/toaster";
import { BottomNav } from "./components/BottomNav";
import { FloatingActionButton } from "./components/FloatingActionButton";
import { IOSSafeAreaWrapper } from "./components/IOSSafeAreaWrapper";
import { IOSStatusBar } from "./components/IOSStatusBar";

// Pages
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Missions from "./pages/Missions";
import VideoCreate from "./pages/VideoCreate";
import VideoList from "./pages/VideoList";
import Videos from "./pages/Videos";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import AdminMissions from "./pages/AdminMissions";
import AdminPrompts from "./pages/AdminPrompts";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

function App() {
  // Set safe area values for CSS variables
  React.useEffect(() => {
    // Set reasonable fallback values for safe areas
    document.documentElement.style.setProperty('--safe-area-top', '24px');
    document.documentElement.style.setProperty('--safe-area-bottom', '34px');
    document.documentElement.style.setProperty('--safe-area-left', '0px');
    document.documentElement.style.setProperty('--safe-area-right', '0px');
  }, []);

  return (
    <Router>
      <AuthProvider>
        <VideoCreateProvider>
          <div className="min-h-screen bg-background">
            <IOSSafeAreaWrapper>
              <IOSStatusBar />
              
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/missions" element={<Missions />} />
                <Route path="/create/*" element={<VideoCreate />} />
                <Route path="/video-list/*" element={<VideoList />} />
                <Route path="/videos" element={<Videos />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin/missions" element={<AdminMissions />} />
                <Route path="/admin/prompts" element={<AdminPrompts />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="*" element={<NotFound />} />
              </Routes>

              <BottomNav />
              <FloatingActionButton />
              <Toaster />
            </IOSSafeAreaWrapper>
          </div>
        </VideoCreateProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
