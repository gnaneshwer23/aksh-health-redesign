import type { Metadata } from "next";
import Link from "next/link";

import { AuthCardLayout } from "@/components/auth/auth-card-layout";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignInFormSkeleton } from "@/components/auth/sign-in-form-skeleton";

export const metadata: Metadata = {
  title: "Sign in | Aksh Health",
  description: "Sign in to your Aksh Health account.",
};

export default function SignInPage() {
  return (
    <AuthCardLayout
      title="Sign in"
      subtitle="Welcome back"
      footer={
        <p className="text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Create account
          </Link>
        </p>
      }
    >
      <div id="signin-static-shell">
        <SignInFormSkeleton />
      </div>
      <SignInForm />
    </AuthCardLayout>
  );
}
