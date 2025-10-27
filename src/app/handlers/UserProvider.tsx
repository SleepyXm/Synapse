"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getUser, validateUser, User } from "../types/auth";

export interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("reactiveLoginKey") ? {} as User : null;
});

  useEffect(() => {
    if (user) {
      validateUser().then(updated => {
        setUser(updated);
      });
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "reactiveLoginKey") {
        setUser(getUser());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be inside UserProvider");
  return ctx;
};