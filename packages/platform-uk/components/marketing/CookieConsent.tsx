"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

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

const actionButtonBase =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2";

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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 p-4 motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300 sm:p-6"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="pointer-events-auto mx-auto w-full max-w-[400px] sm:ml-auto sm:mr-6">
        <div className="overflow-hidden rounded-3xl border border-[var(--mk-line)] bg-white shadow-[var(--mk-shadow-frame)]">
          {showPreferences ? (
            <div className="p-5" role="region" aria-label="Cookie preferences" id="cookie-preferences-panel">
              <p className="text-sm font-semibold text-navy">Cookie settings</p>
              <p className="mt-2 text-sm leading-relaxed text-steel">
                Choose which cookies you are happy for us to use. Essential cookies are always active because the
                platform needs them to work.
              </p>

              <ul className="mt-4 space-y-3">
                <li className="rounded-lg border border-border-subtle bg-surface/60 px-3 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-navy">Essential cookies</p>
                      <p className="mt-1 text-xs leading-relaxed text-steel">
                        Required for sign-in, security, and core platform features.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald/10 px-2.5 py-1 text-xs font-medium text-emerald">
                      Always on
                    </span>
                  </div>
                </li>
                <li className="rounded-lg border border-border-subtle bg-surface/60 px-3 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-navy">Analytics cookies</p>
                      <p className="mt-1 text-xs leading-relaxed text-steel">
                        Not currently used. Enable only if you want to accept optional analytics when we introduce
                        them.
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
                  </div>
                </li>
              </ul>

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  className={cn(actionButtonBase, "bg-emerald text-white hover:bg-emerald/90")}
                  onClick={savePreferences}
                >
                  Save preferences
                </button>
                <button
                  type="button"
                  className={cn(
                    actionButtonBase,
                    "border border-navy/20 bg-white text-navy hover:border-navy/40 hover:bg-navy/[0.03]"
                  )}
                  onClick={() => setShowPreferences(false)}
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3 p-5">
                <h2 id="cookie-consent-title" className="sr-only">
                  Cookies on Aksh Health
                </h2>
                <p className="text-sm leading-relaxed text-slate">
                  We use essential cookies to keep you signed in and to protect the platform. We may also use optional
                  analytics cookies in future to improve our services.
                </p>
                <p id="cookie-consent-description" className="text-sm leading-relaxed text-slate">
                  For descriptions of each type of cookie, visit our{" "}
                  <Link href="/cookies" className="font-medium text-navy underline underline-offset-2 hover:text-emerald">
                    Cookie Policy
                  </Link>
                  . Click &lsquo;Accept all&rsquo; to enable optional cookies, &lsquo;Reject all&rsquo; to decline
                  them, or &lsquo;Settings&rsquo; to choose your preferences.
                </p>
              </div>

              <div className="border-t border-border-subtle" aria-hidden />

              <div className="space-y-2.5 p-5" role="group" aria-label="Cookie consent actions">
                <button
                  type="button"
                  className={cn(actionButtonBase, "bg-emerald text-white hover:bg-emerald/90")}
                  onClick={() => accept("all")}
                >
                  Accept all
                </button>
                <button
                  type="button"
                  className={cn(
                    actionButtonBase,
                    "border border-navy/20 bg-white text-navy hover:border-navy/40 hover:bg-navy/[0.03]"
                  )}
                  onClick={() => setShowPreferences(true)}
                  aria-expanded={showPreferences}
                  aria-controls="cookie-preferences-panel"
                >
                  Settings
                </button>
                <button
                  type="button"
                  className={cn(actionButtonBase, "bg-navy text-white hover:bg-navy/90")}
                  onClick={() => accept("essential")}
                >
                  Reject all
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function hasAnalyticsConsent(): boolean {
  return readStoredConsent() === "all";
}
