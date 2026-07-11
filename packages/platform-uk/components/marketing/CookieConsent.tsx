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

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white p-4 shadow-lg md:p-6"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <p id="cookie-consent-title" className="text-sm font-semibold text-navy">
            Cookies on Aksh Health
          </p>
          <p id="cookie-consent-description" className="mt-1 text-sm leading-relaxed text-steel">
            We use essential cookies to keep you signed in and to protect the platform. Optional analytics cookies
            are not currently enabled. If we add analytics in future, they will only run with your consent. Read
            our{" "}
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => accept("essential")}>
            Essential only
          </Button>
          <Button type="button" className="rounded-xl bg-accent hover:bg-accent/90" onClick={() => accept("all")}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}

export function hasAnalyticsConsent(): boolean {
  return readStoredConsent() === "all";
}
