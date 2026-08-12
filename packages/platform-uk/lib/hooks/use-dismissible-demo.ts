"use client";

import { useEffect, useState } from "react";

/**
 * Quiet-first-paint dismissible chrome (same pattern as GP / pharmacist hero demos).
 * Starts hidden until localStorage is read; shows when never dismissed; stays off after dismiss.
 */
export function useDismissibleDemo(storageKey: string, forceShow = false) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (forceShow) {
      setDismissed(false);
      return;
    }
    try {
      setDismissed(localStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [forceShow, storageKey]);

  function dismiss() {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  function restore() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setDismissed(false);
  }

  return { dismissed, dismiss, restore };
}
