"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";

import { AuthCardLayout } from "@/components/auth/auth-card-layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resolvePostAuthRedirect } from "@/lib/auth/redirects";
import { signInSchema, type SignInInput } from "@/lib/auth/schemas";
import { DEMO_TEST_CREDENTIALS } from "@/lib/auth/demo-credentials";
import { PROOF_MODE_BANNER } from "@/lib/compliance-labels";
import { authConfig, isClinicalOAuthConfigured } from "@/lib/auth/config";

function SignInFormInner() {
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const oauthReady = isClinicalOAuthConfigured();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInInput) {
    setError("");
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    const sessionResponse = await fetch("/api/auth/session");
    const session = (await sessionResponse.json()) as {
      user?: { role?: string; onboardingComplete?: boolean };
    };

    const destination = resolvePostAuthRedirect({
      onboardingComplete: Boolean(session.user?.onboardingComplete),
      role: (session.user?.role as never) ?? null,
      callbackUrl,
    });

    window.location.href = destination;
  }

  async function handleClinicalOAuth() {
    setError("");
    await signIn("clinical-oauth", { callbackUrl: callbackUrl ?? undefined });
  }

  return (
    <AuthCardLayout
      title="Sign in to your account"
      subtitle="Clinical AI workflow platform with human-gated review"
      footer={
        <p className="text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Create account
          </Link>
        </p>
      }
    >
      {authConfig.proofMode ? (
        <div className="mb-4 rounded-xl border border-navy/10 bg-navy-light px-4 py-3 text-sm text-slate" role="note">
          <strong className="text-primary">{PROOF_MODE_BANNER.title}</strong>
          <p className="mt-1 text-muted">{PROOF_MODE_BANNER.body}</p>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </div>
      ) : null}

      {oauthReady ? (
        <Button
          type="button"
          variant="outline"
          className="mb-4 w-full rounded-xl"
          disabled={form.formState.isSubmitting}
          onClick={handleClinicalOAuth}
        >
          Sign in with clinical identity provider
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="mb-4 w-full rounded-xl"
          disabled
          title="Configure CLINICAL_OAUTH_* env vars"
        >
          Clinical identity provider (not configured)
        </Button>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    data-testid="signin-email"
                    type="email"
                    autoComplete="email"
                    placeholder="doctor@akshhealth.com"
                    className="rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    data-testid="signin-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            data-testid="signin-submit"
            type="submit"
            className="w-full rounded-xl bg-accent hover:bg-accent/90"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>

      <div className="mt-6 rounded-xl bg-surface-muted px-4 py-3 text-sm text-muted">
        <p className="font-medium text-slate">Demo account</p>
        <p className="mt-1">
          <code>{DEMO_TEST_CREDENTIALS.email}</code> / <code>{DEMO_TEST_CREDENTIALS.password}</code>
        </p>
      </div>
    </AuthCardLayout>
  );
}

export function SignInForm() {
  return (
    <Suspense fallback={<AuthCardLayout title="Sign in to your account">Loading…</AuthCardLayout>}>
      <SignInFormInner />
    </Suspense>
  );
}
