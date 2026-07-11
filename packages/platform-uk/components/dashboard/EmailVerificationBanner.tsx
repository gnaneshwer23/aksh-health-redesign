"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { cn } from "@/lib/utils";

export function EmailVerificationBanner({ className }: { className?: string }) {
  const { profile } = useUserProfile();
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!profile || profile.emailVerified || dismissed) return null;

  async function resendVerification() {
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      const body = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(body.error ?? "Unable to resend verification email.");
        return;
      }

      setStatus("sent");
      setMessage(body.message ?? "Verification email sent.");
    } catch {
      setStatus("error");
      setMessage("Unable to resend verification email.");
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="pr-8 sm:pr-0">
        <p className="font-semibold">Verify your email address</p>
        <p className="mt-0.5 text-amber-900/90">
          We sent a verification link to {profile.email ?? "your inbox"}. Check your email to confirm your account.{" "}
          <Link href="/verify-email" className="font-medium underline underline-offset-2 hover:text-amber-950">
            Learn more
          </Link>
        </p>
        {message ? <p className="mt-1 text-xs text-amber-900/80">{message}</p> : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-lg border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
          disabled={status === "sending"}
          onClick={resendVerification}
        >
          {status === "sending" ? "Sending…" : "Resend email"}
        </Button>
        <button
          type="button"
          aria-label="Dismiss email verification reminder"
          className="rounded-lg p-1.5 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
