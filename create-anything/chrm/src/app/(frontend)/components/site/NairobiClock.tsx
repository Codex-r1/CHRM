"use client";

import { useEffect, useState } from "react";
import { SOCIETY } from "../../content/site";

const formatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: SOCIETY.timeZone,
});

interface ClockParts {
  hour: string;
  minute: string;
  dayPeriod: string;
  colonOn: boolean;
}

function read(): ClockParts {
  const now = new Date();
  const parts: Record<string, string> = {};
  formatter.formatToParts(now).forEach((p) => (parts[p.type] = p.value));
  return {
    hour: parts.hour,
    minute: parts.minute,
    dayPeriod: parts.dayPeriod,
    colonOn: Math.floor(now.getTime() / 1000) % 2 === 0,
  };
}

/** Live local time at the school, with a blinking colon. Renders nothing until mounted to avoid hydration mismatch. */
export default function NairobiClock() {
  const [t, setT] = useState<ClockParts | null>(null);

  useEffect(() => {
    setT(read());
    const id = setInterval(() => setT(read()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!t) return <span className="ot-clock" />;

  return (
    <span className="ot-clock">
      <time aria-label={`${t.hour}:${t.minute} ${t.dayPeriod} in Nairobi`}>
        {t.hour}
        <span className="ot-clock-colon" style={{ opacity: t.colonOn ? 1 : 0 }} aria-hidden="true">
          :
        </span>
        {t.minute} {t.dayPeriod} Nairobi
      </time>
    </span>
  );
}
