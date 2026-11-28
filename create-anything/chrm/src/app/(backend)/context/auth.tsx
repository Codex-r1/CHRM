// app/(backend)/context/auth.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  full_name?: string;
  membership_number?: string;
  role?: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
    membership_number?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>;
  setUser: (user: User | null) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      // Show the cached user straight away, then confirm with the server, which checks
      // the httpOnly session cookies. A stale cache is cleared if the server says no.
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
            setLoading(false);
          } catch {
            localStorage.removeItem("user");
          }
        }

        const response = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
            if (data.access_token) localStorage.setItem("access_token", data.access_token);
          }
        } else if (response.status === 401 || response.status === 404) {
          setUser(null);
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

    const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('lastActivity', Date.now().toString());

      // ← NEW: store Supabase tokens
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      localStorage.removeItem('refresh_token'); // legacy: no longer stored in the browser

      const redirectPath = data.role === 'admin' ? '/admin/dashboard' : '/member/dashboard';
      window.location.href = redirectPath;

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

   const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');   // ← NEW
      localStorage.removeItem('refresh_token');  // ← NEW
      sessionStorage.clear();

      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.href = '/';
    }
  };

  const register = async (data: any) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  // Add the refreshSession method
    const refreshSession = async () => {
    try {
      localStorage.setItem('lastActivity', Date.now().toString());

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        // ← NEW: update token if refresh returns a new one
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  };

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      register, 
      setUser,
      refreshSession // Add this to the provider value
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};