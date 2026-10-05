"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type MotionPreference = "system" | "full" | "reduced";

type MotionSnapshot = {
  preference: MotionPreference;
  motionEnabled: boolean;
  hydrated: boolean;
};

export type MotionContextValue = MotionSnapshot & {
  setMotionEnabled: (enabled: boolean) => void;
  setMotionPreference: (preference: MotionPreference) => void;
};

const STORAGE_KEY = "amara-motion-preference-v1";

const serverSnapshot: MotionSnapshot = {
  preference: "system",
  motionEnabled: false,
  hydrated: false,
};

let snapshot = serverSnapshot;
let systemPrefersReducedMotion = true;
let mediaQuery: MediaQueryList | null = null;
let mediaQueryListening = false;
const listeners = new Set<() => void>();

function applyRootMotion(enabled: boolean) {
  document.documentElement.dataset.motion = enabled ? "full" : "reduced";
}

function notify() {
  listeners.forEach((listener) => listener());
}

function enabledForPreference(preference: MotionPreference) {
  if (preference === "full") return true;
  if (preference === "reduced") return false;
  return !systemPrefersReducedMotion;
}

function handleSystemPreferenceChange(event: MediaQueryListEvent) {
  systemPrefersReducedMotion = event.matches;
  if (snapshot.preference === "system") {
    snapshot = { ...snapshot, motionEnabled: !systemPrefersReducedMotion };
    applyRootMotion(snapshot.motionEnabled);
    notify();
  }
}

function hydrate() {
  if (snapshot.hydrated) return;

  try {
    mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    systemPrefersReducedMotion = mediaQuery.matches;
  } catch {
    systemPrefersReducedMotion = true;
    mediaQuery = null;
  }

  let preference: MotionPreference = "system";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "full" || saved === "reduced") preference = saved;
  } catch {
    // Motion still follows the system preference when browser storage is unavailable.
  }

  snapshot = {
    preference,
    motionEnabled: enabledForPreference(preference),
    hydrated: true,
  };
  applyRootMotion(snapshot.motionEnabled);
  notify();
}

function listenForSystemPreference() {
  if (!mediaQuery || mediaQueryListening) return;
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleSystemPreferenceChange);
  } else {
    mediaQuery.addListener(handleSystemPreferenceChange);
  }
  mediaQueryListening = true;
}

function stopListeningForSystemPreference() {
  if (!mediaQuery || !mediaQueryListening) return;
  if (mediaQuery.removeEventListener) {
    mediaQuery.removeEventListener("change", handleSystemPreferenceChange);
  } else {
    mediaQuery.removeListener(handleSystemPreferenceChange);
  }
  mediaQueryListening = false;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrate();
  listenForSystemPreference();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopListeningForSystemPreference();
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return serverSnapshot;
}

function setMotionPreference(preference: MotionPreference) {
  const enabled = enabledForPreference(preference);
  snapshot = { ...snapshot, preference, motionEnabled: enabled };
  applyRootMotion(enabled);
  try {
    if (preference === "system") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Keep the selection for this session even if it cannot be persisted.
  }
  notify();
}

function setMotionEnabled(enabled: boolean) {
  setMotionPreference(enabled ? "full" : "reduced");
}

const MotionContext = createContext<MotionContextValue | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const value = useMemo<MotionContextValue>(
    () => ({ ...current, setMotionEnabled, setMotionPreference }),
    [current],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion(): MotionContextValue {
  const value = useContext(MotionContext);
  if (!value) throw new Error("useMotion must be used within a MotionProvider");
  return value;
}
