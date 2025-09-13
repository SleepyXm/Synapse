"use client";

import { ReactNode, Children, isValidElement, cloneElement, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./components/AxonNav";
import { checkAuth } from "./components/auth";

type ClientWrapperProps = {
  children: ReactNode; // <- allow any valid ReactNode
};

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const pathname = usePathname();
  const [user, setUser] = useState(false);

  useEffect(() => {
    checkAuth().then(setUser);
  }, []);

  const showNav = pathname.startsWith("/");

  return (
    <>
      {showNav && <Navbar user={user} />} {/* pass it directly */}
      {children} {/* leave children untouched */}
    </>
  );
}