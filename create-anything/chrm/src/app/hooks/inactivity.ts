"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase/client";

const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutes

export function useInactivityLogout() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      console.log("User inactive. Logging out...");
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    }, INACTIVITY_TIME);
  };

  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    // Start timer on mount
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, []);
}
