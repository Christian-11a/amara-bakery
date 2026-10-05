"use client";

import { useEffect, useRef, useState } from "react";
import { useMotion } from "@/context/motion-context";
import type { MotionPreference } from "@/context/motion-context";

export function MotionToggle({
  className = "",
  enableOnly = false,
}: {
  className?: string;
  enableOnly?: boolean;
}) {
  const { motionEnabled, hydrated, setMotionEnabled } = useMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const focusStatusRef = useRef<HTMLSpanElement>(null);
  const [returnFocusToStatus, setReturnFocusToStatus] = useState(false);

  useEffect(() => {
    if (enableOnly && motionEnabled && returnFocusToStatus) {
      focusStatusRef.current?.focus();
    }
  }, [enableOnly, motionEnabled, returnFocusToStatus]);

  if (!hydrated) return null;
  if (enableOnly && motionEnabled) {
    return returnFocusToStatus ? (
      <span ref={focusStatusRef} className="sr-only" role="status" tabIndex={-1}>
        Motion enabled.
      </span>
    ) : null;
  }

  return (
    <button
      ref={buttonRef}
      className={className}
      type="button"
      aria-pressed={motionEnabled}
      onClick={() => {
        if (enableOnly && !motionEnabled && document.activeElement === buttonRef.current) {
          setReturnFocusToStatus(true);
        }
        setMotionEnabled(!motionEnabled);
      }}
    >
      {motionEnabled ? "Turn off motion" : "Enable motion"}
    </button>
  );
}

export function MotionPreferenceSelect({ className = "" }: { className?: string }) {
  const { preference, hydrated, setMotionPreference } = useMotion();
  if (!hydrated) return null;

  return (
    <label className="site-footer__motion-setting">
      <span>Motion</span>
      <select
        className={className}
        aria-label="Motion preference"
        value={preference}
        onChange={(event) => setMotionPreference(event.currentTarget.value as MotionPreference)}
      >
        <option value="system">Follow system</option>
        <option value="full">Enable motion</option>
        <option value="reduced">Reduce motion</option>
      </select>
    </label>
  );
}
