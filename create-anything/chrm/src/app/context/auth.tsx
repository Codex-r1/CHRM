// app/context/auth.tsx
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';

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

// Session timeout configuration
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute
const SESSION_WARNING_TIME = 5 * 60 * 1000; // Warn 5 minutes before timeout

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const router = useRouter();

  // Update last activity time
  const updateActivity = () => {
    setLastActivity(Date.now());
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Check for session timeout
  useEffect(() => {
    const checkSessionTimeout = setInterval(() => {
      const lastActivityTime = parseInt(localStorage.getItem('lastActivity') || Date.now().toString());
      const timeSinceLastActivity = Date.now() - lastActivityTime;

      // Warn user before logout (5 minutes before)
      if (timeSinceLastActivity > SESSION_TIMEOUT - SESSION_WARNING_TIME && 
          timeSinceLastActivity < SESSION_TIMEOUT) {
        const minutesLeft = Math.ceil((SESSION_TIMEOUT - timeSinceLastActivity) / 60000);
        console.warn(`Session will expire in ${minutesLeft} minute(s) due to inactivity`);
        
        // You can show a toast notification here
        // toast.warning(`Your session will expire in ${minutesLeft} minute(s) due to inactivity`);
      }

      // Auto logout after timeout
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        console.log('Session expired due to inactivity');
        handleAutoLogout();
      }
    }, ACTIVITY_CHECK_INTERVAL);

    return () => clearInterval(checkSessionTimeout);
  }, []);

  const handleAutoLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('lastActivity');
    router.push('/login?reason=session_expired');
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('lastActivity');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (session?.user) {
        setUser(session.user);
        updateActivity();
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      await handleAutoLogout();
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        updateActivity();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        updateActivity();
      } else {
        localStorage.removeItem('lastActivity');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Refresh session periodically if user is active
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      
      // Only refresh if user has been active recently
      if (timeSinceLastActivity < SESSION_TIMEOUT) {
        await refreshSession();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [user, lastActivity]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};