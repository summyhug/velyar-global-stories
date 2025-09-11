import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { FloatingActionButton } from "./FloatingActionButton";

export const ProtectedLayout = () => {
  const location = useLocation();
  const hiddenChromePaths = ["/record-test"]; // Hide bottom nav & FAB on these routes
  const hideChrome = hiddenChromePaths.includes(location.pathname);
  return (
    <>
      <Outlet />
      {!hideChrome && <BottomNav />}
      {!hideChrome && <FloatingActionButton />}
    </>
  );
};
