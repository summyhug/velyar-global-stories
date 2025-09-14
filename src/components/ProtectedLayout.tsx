import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export const ProtectedLayout = () => {
  const location = useLocation();
  const hiddenChromePaths = ["/video-preview"]; // Hide bottom nav & FAB on these routes
  const hideChrome = hiddenChromePaths.includes(location.pathname);
  return (
    <>
      <Outlet />
      {!hideChrome && <BottomNav />}
    </>
  );
};
