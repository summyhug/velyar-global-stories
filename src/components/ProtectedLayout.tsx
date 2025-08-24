import React from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { FloatingActionButton } from "./FloatingActionButton";

export const ProtectedLayout = () => {
  return (
    <>
      <Outlet />
      <BottomNav />
      <FloatingActionButton />
    </>
  );
};
