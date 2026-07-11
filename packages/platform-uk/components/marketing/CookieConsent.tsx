"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "aksh_cookie_consent";

type ConsentChoice = "essential" | "all";

function readStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (value === "essential" || value === "all") return value;
  return null;
}

function storeConsent(choice: ConsentChoice) {
  window.localStorage.setItem(STORAGE_KEY, choice);
  window.dispatchEvent(new CustomEvent("aksh-cookie-consent", { detail: choice }));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    if (!readStoredConsent()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function accept(choice: ConsentChoice) {
    storeConsent(choice);
    setVisible(false);
  }

  function savePreferences() {
    accept(analyticsEnabled ? "all" : "essential");
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald/20 bg-[#f4f9f7] p-4 shadow-[0_-8px_32px_rgba(15,23,42,0.08)] motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300 md:p-6"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <p id="cookie-consent-title" className="text-sm font-semibold text-navy">
              Cookies on Aksh Health
            </p>
            <p id="cookie-consent-description" className="mt-1 text-sm leading-relaxed text-steel">
              We use essential cookies to keep you signed in and to protect the platform. We do not currently use
              analytics cookies. If we add analytics in future, they will only run with your consent. Read our{" "}
              <Link href="/cookies" className="font-medium text-primary hover:underline">
                Cookie Policy
              </Link>{" "}
              or{" "}
              <Link href="/privacy#cookies" className="font-medium text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              for details.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row" role="group" aria-label="Cookie consent actions">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-emerald/30 bg-white focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
              onClick={() => accept("essential")}
            >
              Essential only
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-emerald/30 bg-white focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
              onClick={() => setShowPreferences((current) => !current)}
              aria-expanded={showPreferences}
              aria-controls="cookie-preferences-panel"
            >
              Manage preferences
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-accent hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
              onClick={() => accept("all")}
            >
              Accept all
            </Button>
          </div>
        </div>

        {showPreferences ? (
          <div
            id="cookie-preferences-panel"
            className="mt-4 rounded-xl border border-emerald/20 bg-white p-4"
            role="region"
            aria-label="Cookie preferences"
          >
            <p className="text-sm font-semibold text-navy">Cookie categories</p>
            <ul className="mt-3 space-y-3">
              <li className="flex items-start justify-between gap-4 rounded-lg bg-surface/60 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-navy">Essential cookies</p>
                  <p className="mt-1 text-xs leading-relaxed text-steel">
                    Required for sign-in, security, and core platform features. Always active.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald/10 px-2.5 py-1 text-xs font-medium text-emerald">
                  Always on
                </span>
              </li>
              <li className="flex items-start justify-between gap-4 rounded-lg bg-surface/60 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-navy">Analytics cookies</p>
                  <p className="mt-1 text-xs leading-relaxed text-steel">
                    Not currently used. Enable only if you want to accept optional analytics when we introduce them.
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-xs text-steel">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-emerald focus:ring-emerald"
                    checked={analyticsEnabled}
                    onChange={(event) => setAnalyticsEnabled(event.target.checked)}
                    aria-label="Enable analytics cookies"
                  />
                  Optional
                </label>
              </li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                className="rounded-xl bg-accent hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
                onClick={savePreferences}
              >
                Save preferences
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function hasAnalyticsConsent(): boolean {
  return readStoredConsent() === "all";
}
