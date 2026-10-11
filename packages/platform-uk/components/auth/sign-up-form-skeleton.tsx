import Link from "next/link";

import { RoleTileStatic } from "@/components/auth/role-tile-static";
import { REAL_ROLES } from "@/lib/env/workspace";
import { ROLES, type UserRole } from "@/lib/onboarding/roles";
import { cn } from "@/lib/utils";

const inputClassName =
  "flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

type SignUpFormSkeletonProps = {
  initialRole?: UserRole;
  /** Real workspace: only roles with a working product. Passed in (the browser cannot read server env). */
  realWorkspace?: boolean;
};

export function SignUpFormSkeleton({ initialRole = "gp", realWorkspace = false }: SignUpFormSkeletonProps) {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none text-foreground" htmlFor="signup-fullname-skeleton">
          Full name
        </label>
        <input
          id="signup-fullname-skeleton"
          name="fullName"
          autoComplete="name"
          placeholder="Dr Jane Smith"
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none text-foreground" htmlFor="signup-email-skeleton">
          Email address
        </label>
        <input
          id="signup-email-skeleton"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you.example"
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium leading-none text-foreground">Your role</span>
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          data-testid="signup-role-grid"
        >
          {(realWorkspace ? ROLES.filter((r) => REAL_ROLES.has(r.id)) : ROLES).map((role) => (
            <RoleTileStatic key={role.id} role={role} selected={role.id === initialRole} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none text-foreground" htmlFor="signup-password-skeleton">
          Password
        </label>
        <input
          id="signup-password-skeleton"
          type="password"
          name="password"
          autoComplete="new-password"
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium leading-none text-foreground"
          htmlFor="signup-confirm-password-skeleton"
        >
          Confirm password
        </label>
        <input
          id="signup-confirm-password-skeleton"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          className={inputClassName}
        />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3">
        <input
          type="checkbox"
          data-testid="signup-accept-terms"
          className="mt-0.5 h-4 w-4 rounded border-border"
        />
        <span className="text-sm font-normal text-steel">
          I agree to the{" "}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
        </span>
      </div>

      <button
        type="submit"
        className={cn(
          "inline-flex h-10 w-full items-center justify-center rounded-xl bg-accent px-4 text-sm font-medium text-primary-foreground"
        )}
      >
        Create account
      </button>
    </form>
  );
}
