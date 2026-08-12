"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { SignInFormSkeleton } from "@/components/auth/sign-in-form-skeleton";
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
import { PROOF_MODE_BANNER } from "@/lib/compliance-labels";
import { authConfig, isClinicalOAuthConfigured } from "@/lib/auth/config";

function SignInFormFields({ callbackUrl }: { callbackUrl: string | null }) {
  const [error, setError] = useState("");
  const oauthReady = isClinicalOAuthConfigured();

  useEffect(() => {
    document.getElementById("signin-static-shell")?.remove();
  }, []);

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
    <>
      {authConfig.proofMode ? (
        <div className="mb-4 rounded-2xl border border-accent/15 bg-pastel-mint px-4 py-3 text-sm text-foreground" role="note">
          <strong className="text-accent">{PROOF_MODE_BANNER.title}</strong>
          <p className="mt-1 text-muted">{PROOF_MODE_BANNER.body}</p>
        </div>
      ) : null}

      {error ? (
        <div
          id="signin-form-error"
          className="mb-4 rounded-xl border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger"
          role="alert"
        >
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
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          aria-describedby={error ? "signin-form-error" : undefined}
        >
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
                    aria-label="Email address"
                    type="email"
                    autoComplete="email"
                    placeholder="you.example"
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
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    {...field}
                    data-testid="signin-password"
                    aria-label="Password"
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
    </>
  );
}

function SignInFormWithSearchParams() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  return <SignInFormFields callbackUrl={callbackUrl} />;
}

export function SignInForm() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Suspense fallback={<SignInFormSkeleton />}>
      <SignInFormWithSearchParams />
    </Suspense>
  );
}
