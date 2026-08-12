import Link from "next/link";

import { PROOF_MODE_BANNER } from "@/lib/compliance-labels";
import { authConfig } from "@/lib/auth/config";
import { cn } from "@/lib/utils";

const inputClassName =
  "flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function SignInFormSkeleton() {
  return (
    <>
      {authConfig.proofMode ? (
        <div
          className="mb-4 rounded-xl border border-navy/10 bg-navy-light px-4 py-3 text-sm text-slate"
          role="note"
        >
          <strong className="text-primary">{PROOF_MODE_BANNER.title}</strong>
          <p className="mt-1 text-muted">{PROOF_MODE_BANNER.body}</p>
        </div>
      ) : null}

      <button
        type="button"
        disabled
        className="mb-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground opacity-50"
        title="Configure CLINICAL_OAUTH_* env vars"
      >
        Clinical identity provider (not configured)
      </button>

      <form className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none text-foreground" htmlFor="signin-email-skeleton">
            Email address
          </label>
          <input
            id="signin-email-skeleton"
            data-testid="signin-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you.example"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium leading-none text-foreground" htmlFor="signin-password-skeleton">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="signin-password-skeleton"
            data-testid="signin-password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            className={inputClassName}
          />
        </div>

        <p className="text-xs leading-relaxed text-muted">
          By signing in you agree to our{" "}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <button
          type="submit"
          data-testid="signin-submit"
          className={cn(
            "inline-flex h-10 w-full items-center justify-center rounded-xl bg-accent px-4 text-sm font-medium text-primary-foreground"
          )}
        >
          Sign in
        </button>
      </form>
    </>
  );
}
