"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { AuthCardLayout } from "@/components/auth/auth-card-layout";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "pending";

  if (status === "success") {
    return (
      <AuthCardLayout
        title="Email verified"
        subtitle="Your email address has been confirmed."
        footer={
          <p className="text-center text-sm text-muted">
            <Link href="/signin" className="font-semibold text-primary hover:underline">
              Sign in to continue
            </Link>
          </p>
        }
      >
        <p className="text-sm text-steel">
          You can now use all features of your Aksh Health account. If you were mid-onboarding, sign in to pick up
          where you left off.
        </p>
        <Button asChild className="mt-6 w-full rounded-xl bg-accent hover:bg-accent/90">
          <Link href="/signin">Continue to sign in</Link>
        </Button>
      </AuthCardLayout>
    );
  }

  if (status === "expired") {
    return (
      <AuthCardLayout
        title="Verification link expired"
        subtitle="This email verification link is no longer valid."
        footer={
          <p className="text-center text-sm text-muted">
            <Link href="/signin" className="font-semibold text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        }
      >
        <p className="text-sm text-steel">
          Sign in to your account and use the resend option on your dashboard to request a new verification email.
        </p>
        <Button asChild variant="outline" className="mt-6 w-full rounded-xl">
          <Link href="/signin">Sign in</Link>
        </Button>
      </AuthCardLayout>
    );
  }

  return (
    <AuthCardLayout
      title="Check your email"
      subtitle="We sent a verification link to your inbox."
      footer={
        <p className="text-center text-sm text-muted">
          Already verified?{" "}
          <Link href="/signin" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <p className="text-sm text-steel">
        Open the link in the email to verify your address. You can continue onboarding and use the platform while you
        wait. A reminder banner will appear on your dashboard until verification is complete.
      </p>
      <p className="mt-4 text-sm text-steel">
        Did not receive the email? Check your spam folder or sign in and use the resend option on your dashboard.
      </p>
    </AuthCardLayout>
  );
}

export function VerifyEmailForm() {
  return (
    <Suspense fallback={<AuthCardLayout title="Verify your email">Loading…</AuthCardLayout>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
