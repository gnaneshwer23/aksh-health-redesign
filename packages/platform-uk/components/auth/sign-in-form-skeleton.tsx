import Link from "next/link";

import { cn } from "@/lib/utils";

const inputClassName =
  "flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function SignInFormSkeleton() {
  return (
    <>


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
            "inline-flex h-10 w-full items-center justify-center rounded-xl bg-secondary px-4 text-sm font-medium text-primary-foreground"
          )}
        >
          Sign in
        </button>
      </form>
    </>
  );
}
