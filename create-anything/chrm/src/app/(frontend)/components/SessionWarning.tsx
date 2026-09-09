"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../(backend)/context/auth';
import { AlertTriangle, X, RefreshCw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_TIMEOUT = 20 * 60 * 1000; // 20 minutes
const WARNING_TIME = 5 * 60 * 1000; // Warn 5 minutes before

export default function SessionWarning() {
  const { user, refreshSession } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkInterval = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || Date.now().toString());
      const timeSinceLastActivity = Date.now() - lastActivity;
      const timeUntilExpiry = SESSION_TIMEOUT - timeSinceLastActivity;

      if (timeUntilExpiry > 0 && timeUntilExpiry <= WARNING_TIME) {
        const minutes = Math.ceil(timeUntilExpiry / 60000);
        setMinutesLeft(minutes);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [user]);

  // Update last activity on user interaction
  useEffect(() => {
    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // Update activity on any user interaction
    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('mousemove', updateActivity);

    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('mousemove', updateActivity);
    };
  }, []);

  const handleStayLoggedIn = async () => {
    setIsRefreshing(true);
    try {
      localStorage.setItem('lastActivity', Date.now().toString());
      await refreshSession();
      setShowWarning(false);
    } catch (error) {
      console.error('Failed to refresh session:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-white border-2 border-[#C9A84C] rounded-lg shadow-xl p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[#C9A84C]/10 rounded-full flex items-center justify-center">
                  <Clock className="text-[#C9A84C]" size={20} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-serif font-bold text-[#1B3A6B] text-lg mb-1">
                  Session Expiring Soon
                </h3>
                <p className="text-sm text-[#1B3A6B]/70 mb-3">
                  Your session will expire in <span className="font-bold text-[#1B3A6B]">{minutesLeft}</span> minute{minutesLeft !== 1 ? 's' : ''} due to inactivity.
                </p>
                <button
                  onClick={handleStayLoggedIn}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Stay Logged In
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={() => setShowWarning(false)}
                className="flex-shrink-0 text-[#1B3A6B]/30 hover:text-[#1B3A6B] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}