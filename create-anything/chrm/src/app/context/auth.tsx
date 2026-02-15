"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase/client";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshSession: async () => {},
});

const SESSION_TIMEOUT = 30 * 60 * 1000; 
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; 
const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 min

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const lastActivityRef = useRef<number>(Date.now());
  const lastActivityWriteRef = useRef<number>(0);

  const setUserIfChanged = useCallback((next: User | null) => {
    setUser((prev) => {
      if (!prev && !next) return prev;
      if (prev?.id === next?.id && prev?.email === next?.email) return prev; // same user, ignore
      return next;
    });
  }, []);

  const updateActivity = useCallback(() => {
    const now = Date.now();

    if (now - lastActivityWriteRef.current < 2000) return;

    lastActivityWriteRef.current = now;
    lastActivityRef.current = now;
    localStorage.setItem("lastActivity", String(now));
  }, []);

  const handleAutoLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUserIfChanged(null);
    localStorage.removeItem("lastActivity");
    router.push("/login?reason=session_expired");
  }, [router, setUserIfChanged]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUserIfChanged(null);
      localStorage.removeItem("lastActivity");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [setUserIfChanged]);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      setUserIfChanged(session?.user ?? null);

      if (session?.user) updateActivity();
    } catch (error) {
      console.error("Session refresh error:", error);
      await handleAutoLogout();
    }
  }, [handleAutoLogout, setUserIfChanged, updateActivity]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUserIfChanged(session?.user ?? null);
      setLoading(false);
      if (session?.user) updateActivity();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserIfChanged(session?.user ?? null);
      setLoading(false);

      if (session?.user) updateActivity();
      else localStorage.removeItem("lastActivity");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUserIfChanged, updateActivity]);

  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((event) => document.addEventListener(event, updateActivity, { passive: true }));

    return () => {
      events.forEach((event) => document.removeEventListener(event, updateActivity));
    };
  }, [user?.id, updateActivity]);


  useEffect(() => {
    if (!user) return;

    const timer = setInterval(() => {
      const last = Number(localStorage.getItem("lastActivity") || String(Date.now()));
      const idle = Date.now() - last;

      if (idle > SESSION_TIMEOUT - SESSION_WARNING_TIME && idle < SESSION_TIMEOUT) {
        const minutesLeft = Math.ceil((SESSION_TIMEOUT - idle) / 60000);
        console.warn(`Session will expire in ${minutesLeft} minute(s) due to inactivity`);
      }

      if (idle > SESSION_TIMEOUT) {
        console.log("Session expired due to inactivity");
        handleAutoLogout();
      }
    }, ACTIVITY_CHECK_INTERVAL);

    return () => clearInterval(timer);
  }, [user?.id, handleAutoLogout]);

  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      const idle = Date.now() - lastActivityRef.current;
      if (idle < SESSION_TIMEOUT) await refreshSession();
    }, 15 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [user?.id, refreshSession]);

  const value = useMemo(
    () => ({ user, loading, logout, refreshSession }),
    [user, loading, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
