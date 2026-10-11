"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { SignUpFormSkeleton } from "@/components/auth/sign-up-form-skeleton";
import { RoleTile } from "@/components/onboarding/RoleTile";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUpSchema, type SignUpInput } from "@/lib/auth/schemas";
import { ROLES, SIGNUP_ROLE_MAP, type UserRole } from "@/lib/onboarding/roles";
import { useRealWorkspace } from "@/components/workspace/WorkspaceMode";
import { REAL_ROLES } from "@/lib/env/workspace";

function resolveInitialRole(roleParam: string | null): UserRole {
  if (!roleParam) return "gp";
  return SIGNUP_ROLE_MAP[roleParam] ?? (roleParam as UserRole);
}

function SignUpFormFields({ initialRoleParam }: { initialRoleParam: string | null }) {
  const router = useRouter();
  const real = useRealWorkspace();
  const roles = real ? ROLES.filter((r) => REAL_ROLES.has(r.id)) : ROLES;
  const requested = resolveInitialRole(initialRoleParam);
  const initialRole = roles.some((r) => r.id === requested) ? requested : "gp";
  const [error, setError] = useState("");

  useEffect(() => {
    document.getElementById("signup-static-shell")?.remove();
  }, []);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: initialRole,
      fullName: "",
      acceptedTerms: undefined,
    },
  });

  useEffect(() => {
    form.setValue("role", initialRole);
  }, [form, initialRole]);

  async function onSubmit(values: SignUpInput) {
    setError("");

    const signupResponse = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const signupBody = (await signupResponse.json()) as { error?: string };
    if (!signupResponse.ok) {
      setError(signupBody.error ?? "Unable to create account. Please try again.");
      return;
    }

    const signInResult = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (signInResult?.error) {
      router.push("/signin");
      return;
    }

    router.push(`/onboarding/role-select?role=${values.role}`);
  }

  return (
    <>
      {error ? (
        <div
          id="signup-form-error"
          className="mb-4 rounded-xl border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          aria-describedby={error ? "signup-form-error" : undefined}
        >
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    aria-label="Full name"
                    placeholder="Dr Jane Smith"
                    className="rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
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
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your role</FormLabel>
                <FormControl>
                  <div
                    className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                    data-testid="signup-role-grid"
                  >
                    {roles.map((role) => (
                      <RoleTile
                        key={role.id}
                        role={role}
                        selected={field.value === role.id}
                        onSelect={() => field.onChange(role.id)}
                      />
                    ))}
                  </div>
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
                    aria-label="Password"
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
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    aria-label="Confirm password"
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
            name="acceptedTerms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3">
                  <FormControl>
                    <Checkbox
                      data-testid="signup-accept-terms"
                      checked={field.value === true}
                      onCheckedChange={(checked) => field.onChange(checked === true ? true : undefined)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal text-steel">
                      I agree to the{" "}
                      <Link href="/terms" className="font-medium text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="font-medium text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="accent"
            className="w-full rounded-xl"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Form>
    </>
  );
}

function SignUpFormWithSearchParams() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  return <SignUpFormFields initialRoleParam={roleParam} />;
}

export function SignUpForm() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Suspense fallback={<SignUpFormSkeleton />}>
      <SignUpFormWithSearchParams />
    </Suspense>
  );
}
