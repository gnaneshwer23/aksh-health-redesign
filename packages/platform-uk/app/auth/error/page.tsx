"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification link has expired or has already been used.",
  CredentialsSignin: "Invalid email or password. Please try again.",
  Default: "An error occurred during sign in.",
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "Default";
  const message = errorMessages[error] ?? errorMessages.Default;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">A</div>
          <span>AkshHealth</span>
        </div>

        <h1 className="auth-title">Sign-in failed</h1>

        <div className="auth-error" role="alert">
          {message}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <Link href="/signin" className="auth-submit" style={{ textAlign: "center", display: "block" }}>
            Try again
          </Link>
        </div>

        <div className="auth-footer">
          <Link href="/" className="auth-back-link">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card" /></div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
