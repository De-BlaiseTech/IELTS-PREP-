import React, { useEffect, useState } from "react";
export default function Timer({ seconds, onExpire, paused=false }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => setRemaining(seconds), [seconds]);
  useEffect(() => {
    if (paused || remaining <= 0) return;
    const id = setInterval(() => setRemaining(v => {
      if (v <= 1) { clearInterval(id); onExpire?.(); return 0; }
      return v - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [paused, remaining, onExpire]);
  const m = Math.floor(remaining / 60).toString().padStart(2,"0");
  const s = (remaining % 60).toString().padStart(2,"0");
  return <div className={`timer ${remaining < 60 ? "danger" : ""}`} aria-label="Time remaining">⏱ {m}:{s}</div>;
}
