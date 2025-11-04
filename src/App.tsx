
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { VideoCreateProvider } from "./contexts/VideoCreateContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Toaster } from "./components/ui/toaster";
import { BottomNav } from "./components/BottomNav";
import { IOSSafeAreaWrapper } from "./components/IOSSafeAreaWrapper";
import { IOSStatusBar } from "./components/IOSStatusBar";
import { AuthGate } from "./components/AuthGate";
import { AdminGate } from "./components/AdminGate";
import { useKeyboardToggle } from "./hooks/useKeyboardToggle";
import { useSafeArea } from "./hooks/useSafeArea";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { ScrollToTop } from "./components/ScrollToTop";
import "./i18n";

// Pages
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Missions from "./pages/Missions";
import VideoCreate from "./pages/VideoCreate";
import VideoList from "./pages/VideoList";
import VideoPreviewShare from "./pages/VideoPreview";
import Videos from "./pages/Videos";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import AdminMissions from "./pages/AdminMissions";
import AdminPrompts from "./pages/AdminPrompts";
import AdminVideos from "./pages/AdminVideos";
import AdminVideoUpload from "./pages/AdminVideoUpload";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import GeneralSettings from "./pages/GeneralSettings";

function App() {
  // Get safe area values and update CSS variables
  const safeArea = useSafeArea();
  
  React.useEffect(() => {
    // Update CSS variables with actual safe area values
    document.documentElement.style.setProperty('--safe-area-top', `${safeArea.top}px`);
    document.documentElement.style.setProperty('--safe-area-bottom', `${safeArea.bottom}px`);
    document.documentElement.style.setProperty('--safe-area-left', `${safeArea.left}px`);
    document.documentElement.style.setProperty('--safe-area-right', `${safeArea.right}px`);
  }, [safeArea]);

  // Handle keyboard show/hide events
  useKeyboardToggle();

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <AuthProvider>
            <VideoCreateProvider>
              <ScrollToTop />
              <div className="min-h-screen bg-background">
                <IOSSafeAreaWrapper>
                  <IOSStatusBar />
                  
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    
                    {/* Protected Routes */}
                    <Route element={<AuthGate />}>
                      <Route element={<ProtectedLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/explore" element={<Explore />} />
                        <Route path="/missions" element={<Missions />} />
                        <Route path="/create/mission/:missionId" element={<VideoCreate />} />
                        <Route path="/create/daily-prompt" element={<VideoCreate />} />
                        <Route path="/create" element={<VideoCreate />} />
                        <Route path="/video-preview" element={<VideoPreviewShare />} />
                        <Route path="/video-list/:type/:id" element={<VideoList />} />
                        <Route path="/videos/:type/:id" element={<Videos />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/general-settings" element={<GeneralSettings />} />
                        <Route path="/admin/upload" element={<AdminVideoUpload />} />
                        
                        {/* Admin Routes - Restricted to admin@velyar.com */}
                        <Route element={<AdminGate />}>
                          <Route path="/admin/missions" element={<AdminMissions />} />
                          <Route path="/admin/prompts" element={<AdminPrompts />} />
                          <Route path="/admin/videos" element={<AdminVideos />} />
                        </Route>
                      </Route>
                    </Route>
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>

                  <Toaster />
                </IOSSafeAreaWrapper>
                
              </div>
            </VideoCreateProvider>
          </AuthProvider>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
