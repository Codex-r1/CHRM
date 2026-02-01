
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_TIMEOUT = 20 * 60 * 1000; // 20 minutes
const WARNING_TIME = 5 * 60 * 1000; // Warn 5 minutes before

export default function SessionWarning() {
  const { user, refreshSession } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(5);

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

  const handleStayLoggedIn = async () => {
    localStorage.setItem('lastActivity', Date.now().toString());
    await refreshSession();
    setShowWarning(false);
  };

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="text-amber-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 mb-1">
                  Session Expiring Soon
                </h3>
                <p className="text-sm text-amber-800 mb-3">
                  Your session will expire in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''} due to inactivity.
                </p>
                <button
                  onClick={handleStayLoggedIn}
                  className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors text-sm"
                >
                  Stay Logged In
                </button>
              </div>
              <button
                onClick={() => setShowWarning(false)}
                className="flex-shrink-0 text-amber-600 hover:text-amber-800"
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