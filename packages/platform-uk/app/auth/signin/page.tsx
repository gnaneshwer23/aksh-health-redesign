"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { PROOF_MODE_BANNER } from "@/lib/compliance-labels";
import { authConfig, isClinicalOAuthConfigured } from "@/lib/auth/config";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/review";
  const oauthReady = isClinicalOAuthConfigured();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClinicalOAuth() {
    setError("");
    setLoading(true);
    try {
      await signIn("clinical-oauth", { callbackUrl });
    } catch {
      setError("Clinical identity provider sign-in is not available in this environment.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">A</div>
          <span>AkshHealth</span>
        </div>

        <h1 className="auth-title">Sign in to your account</h1>
        <p className="auth-subtitle">Clinical AI workflow platform — human-gated review</p>

        {authConfig.proofMode ? (
          <div className="auth-proof-banner" role="note">
            <strong>{PROOF_MODE_BANNER.title}</strong>
            <p>{PROOF_MODE_BANNER.body}</p>
          </div>
        ) : null}

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {oauthReady ? (
          <button className="auth-submit auth-submit--oauth" disabled={loading} onClick={handleClinicalOAuth} type="button">
            Sign in with clinical identity provider
          </button>
        ) : (
          <button className="auth-submit auth-submit--oauth is-disabled" disabled title="Configure CLINICAL_OAUTH_* env vars" type="button">
            Clinical identity provider (not configured)
          </button>
        )}

        <p className="auth-divider">or use demo credentials</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">
              Email address
            </label>
            <input
              data-testid="signin-email"
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="doctor@akshhealth.com"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <input
              data-testid="signin-password"
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Enter your password"
            />
          </div>

          <button
            data-testid="signin-submit"
            type="submit"
            disabled={loading}
            className="auth-submit"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="auth-demo-creds">
          <p className="auth-demo-title">Demo accounts</p>
          <p className="auth-demo-row">
            <code>doctor@akshhealth.com</code>
          </p>
          <p className="auth-demo-row">
            <code>reviewer@akshhealth.com</code>
          </p>
          <p className="auth-demo-row">Use the demo password configured for this environment.</p>
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

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card" /></div>}>
      <SignInForm />
    </Suspense>
  );
}
