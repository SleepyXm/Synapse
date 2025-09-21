"use client";

import { ReactNode } from "react";
import Navbar from "./components/AxonNav";

type ClientWrapperProps = {
  children: ReactNode;
};

export default function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <>
      <Navbar />  {/* Navbar will get user from context using useUser() */}
      {children}  {/* Pages get user from context using useUser() */}
    </>
  );
}