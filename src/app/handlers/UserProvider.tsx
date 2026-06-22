"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { validateUser, User } from "../types/auth";

export interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  resolved: boolean;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [resolved, setResolved] = useState(false);
  const didRun = useRef(false);

  const initAuth = async () => {
    try {
      const result = await validateUser();
      setUser(result);
    } catch {
      setUser(null);
    } finally {
      setResolved(true);
    }
  };

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    initAuth();

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) initAuth();
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, resolved }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be inside UserProvider");
  return ctx;
};