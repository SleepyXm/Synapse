"use client";

import { ReactNode, useState, useEffect } from "react";
import Navbar from "./components/AxonNav";
import { checkAuth } from "./components/auth";
import React from "react";
import Profile from "./Profile/page";

type ClientWrapperProps = {
  children: ReactNode;
};

type User = {
  username: string;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth().then((userObj) => setUser(userObj));
  }, []);

  return (
    <>
      {mounted && <Navbar user={user} />}      
      {mounted && window.location.pathname === "/Profile" ? (
        <Profile user={user} />
      ) : (
        React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<any>, { user })
            : child
        )
      )}
    </>
  );
}