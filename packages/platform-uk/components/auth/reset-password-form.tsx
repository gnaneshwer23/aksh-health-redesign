"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";

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
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/auth/password-reset-schemas";

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState("");

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setError("");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const body = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(body.error ?? "Unable to reset password. Please try again.");
      return;
    }

    router.push("/signin?reset=success");
  }

  if (!token) {
    return (
      <AuthCardLayout
        title="Invalid reset link"
        subtitle="This password reset link is missing or invalid."
        footer={
          <p className="text-center text-sm text-muted">
            <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
              Request a new reset link
            </Link>
          </p>
        }
      >
        <p className="text-sm text-steel">Please request a new password reset email and use the link provided.</p>
      </AuthCardLayout>
    );
  }

  return (
    <AuthCardLayout
      title="Choose a new password"
      subtitle="Enter a new password for your Aksh Health account."
      footer={
        <p className="text-center text-sm text-muted">
          <Link href="/signin" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </div>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register("token")} />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    data-testid="reset-password-new"
                    type="password"
                    autoComplete="new-password"
                    className="rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    data-testid="reset-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    className="rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            data-testid="reset-password-submit"
            type="submit"
            className="w-full rounded-xl bg-accent hover:bg-accent/90"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </Form>
    </AuthCardLayout>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<AuthCardLayout title="Choose a new password">Loading…</AuthCardLayout>}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
