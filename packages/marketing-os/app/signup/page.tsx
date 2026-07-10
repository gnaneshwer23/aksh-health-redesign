"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleSelector } from "@/components/shared/RoleSelector";
import { signupRoles, type SignupRoleId } from "@/lib/content";
import { getPlatformOnboardingUrl } from "@/lib/platform-url";

function SignupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleParam = searchParams.get("role") as SignupRoleId | null;
  const [selectedRole, setSelectedRole] = useState<SignupRoleId | undefined>(
    roleParam && signupRoles.some((r) => r.id === roleParam)
      ? roleParam
      : undefined
  );
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");

  const role = signupRoles.find((r) => r.id === selectedRole);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    window.location.href = getPlatformOnboardingUrl(selectedRole);
  };

  if (!selectedRole) {
    return (
      <div>
        <h2 className="text-xl font-semibold">Select your role</h2>
        <p className="mt-2 text-sm text-muted">
          Choose how you will use Aksh Health
        </p>
        <RoleSelector
          className="mt-6"
          onSelect={(roleId) => {
            setSelectedRole(roleId);
            router.replace(`/signup?role=${roleId}`);
          }}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign up as {role?.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Full name</label>
            <input
              required
              className="mt-1 w-full rounded-sm border border-border px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              required
              type="email"
              className="mt-1 w-full rounded-sm border border-border px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {selectedRole !== "patient" ? (
            <div>
              <label className="text-sm font-medium">Organisation</label>
              <input
                required
                className="mt-1 w-full rounded-sm border border-border px-3 py-2 text-sm"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
              />
            </div>
          ) : null}
          {selectedRole === "gp" || selectedRole === "nurse" ? (
            <div>
              <label className="text-sm font-medium">GMC / NMC number</label>
              <input
                className="mt-1 w-full rounded-sm border border-border px-3 py-2 text-sm"
              />
            </div>
          ) : null}
          {selectedRole === "hospital-executive" ? (
            <div>
              <label className="text-sm font-medium">Job title</label>
              <input
                className="mt-1 w-full rounded-sm border border-border px-3 py-2 text-sm"
              />
            </div>
          ) : null}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedRole(undefined);
                router.replace("/signup");
              }}
            >
              Change role
            </Button>
            <Button type="submit">Continue to onboarding</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold">Sign In / Sign Up</h1>
        <p className="mt-2 text-muted">
          Role-aware entry to the Aksh Health platform
        </p>
        <div className="mt-8">
          <Suspense fallback={<p>Loading...</p>}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
