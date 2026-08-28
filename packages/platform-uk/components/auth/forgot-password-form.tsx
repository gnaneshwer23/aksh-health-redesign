"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
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
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/auth/password-reset-schemas";

export function ForgotPasswordForm({ deliveryHint }: { deliveryHint?: string | null }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setError("");
    setMessage("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const body = (await response.json()) as { message?: string; error?: string };

    if (!response.ok) {
      setError(body.error ?? "Unable to process request. Please try again.");
      return;
    }

    setMessage(body.message ?? "If an account exists, we sent instructions.");
    form.reset();
  }

  return (
    <AuthCardLayout
      title="Reset your password"
      subtitle="Enter your email address and we will send reset instructions if an account exists."
      footer={
        <p className="text-center text-sm text-muted">
          Remember your password?{" "}
          <Link href="/signin" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mb-4 rounded-xl border border-emerald/20 bg-emerald/5 px-4 py-3 text-sm text-emerald" role="status">
          {message}
          {deliveryHint ? <p className="mt-2 text-xs text-emerald/90">{deliveryHint}</p> : null}
        </div>
      ) : null}

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
                    data-testid="forgot-password-email"
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

          <Button
            data-testid="forgot-password-submit"
            type="submit"
            className="w-full rounded-xl bg-accent hover:bg-accent/90"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Sending…" : "Send reset instructions"}
          </Button>
        </form>
      </Form>
    </AuthCardLayout>
  );
}
