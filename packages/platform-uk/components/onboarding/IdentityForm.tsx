"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registrationFieldFor, type OnboardingMarket } from "@/lib/onboarding/markets";
import type { UserRole } from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";
import { getIdentitySchema } from "@/lib/onboarding/validation";

type IdentityFormProps = {
  role: UserRole;
  onSubmit: () => void;
};

type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "date";
  placeholder?: string;
  hint?: string;
  options?: readonly string[];
  half?: boolean;
};

const PHONE_HINT = "Optional. Include the country code if you are outside your market.";

function fieldsFor(role: UserRole, market: OnboardingMarket): FieldSpec[] {
  const registration = registrationFieldFor(role, market);
  switch (role) {
    case "gp":
    case "nurse":
    case "clinical-pharmacist":
      return [
        { name: "fullName", label: "Full name" },
        {
          name: "registrationNumber",
          label: `${registration?.label ?? "Registration number"} (optional)`,
          placeholder: registration?.placeholder,
          hint: "Recorded as unverified. Not needed for the synthetic workspace; checked before any live patient data.",
        },
        { name: "workEmail", label: "Work email", type: "email" },
        { name: "phone", label: "Phone", type: "tel", hint: PHONE_HINT },
      ];
    case "practice-manager":
      return [
        { name: "fullName", label: "Full name" },
        { name: "workEmail", label: "Work email", type: "email" },
        { name: "jobTitle", label: "Job title" },
        { name: "phone", label: "Phone", type: "tel", hint: PHONE_HINT },
      ];
    case "ics-lead":
      return [
        { name: "fullName", label: "Full name" },
        { name: "workEmail", label: "Work email", type: "email" },
        { name: "jobTitle", label: "Job title" },
        { name: "networkName", label: "Network, region or health system (optional)" },
      ];
    case "hospital-executive":
      return [
        { name: "fullName", label: "Full name" },
        { name: "workEmail", label: "Work email", type: "email" },
        { name: "jobTitle", label: "Job title", options: ["CEO", "COO", "CMO", "CFO", "CIO", "Other"] },
        { name: "phone", label: "Phone", type: "tel", hint: PHONE_HINT },
      ];
    case "researcher":
      return [
        { name: "fullName", label: "Full name" },
        { name: "institutionalEmail", label: "Institutional email", type: "email" },
        { name: "institutionName", label: "Institution" },
        { name: "orcid", label: "ORCID (optional)", placeholder: "0000-0000-0000-0000" },
      ];
    case "patient":
      return [
        { name: "firstName", label: "First name", half: true },
        { name: "lastName", label: "Last name", half: true },
        { name: "dateOfBirth", label: "Date of birth", type: "date" },
        {
          name: "inviteCode",
          label: "Clinic invite code (optional)",
          placeholder: "e.g. AKSH-W0123",
          hint: "From your clinic. It links your account to your care team. Without one you can still use Asha and track your own readings.",
        },
        { name: "email", label: "Email", type: "email", half: true },
        { name: "phone", label: "Phone", type: "tel", half: true },
      ];
  }
}

export function IdentityForm({ role, onSubmit }: IdentityFormProps) {
  const identity = useOnboardingStore((s) => s.identity);
  const setIdentity = useOnboardingStore((s) => s.setIdentity);
  const market = useOnboardingStore((s) => s.market);

  type FormValues = Record<string, unknown>;
  const form = useForm<FormValues>({
    resolver: zodResolver(getIdentitySchema(role)) as never,
    defaultValues: identity as FormValues,
    mode: "onChange",
  });

  async function submit(values: FormValues) {
    const inviteCode = typeof values.inviteCode === "string" ? values.inviteCode.trim() : "";
    if (role === "patient" && inviteCode) {
      const res = await fetch("/api/onboarding/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode, dateOfBirth: values.dateOfBirth }),
      }).catch(() => null);
      const body = (await res?.json().catch(() => null)) as { status?: string; error?: string } | null;
      if (body?.status !== "linked") {
        form.setError("inviteCode", {
          message:
            res?.status === 429
              ? body?.error ?? "Too many attempts. Try again later."
              : "We could not match this code with your date of birth. Check both with your clinic, or leave the code blank to continue without linking.",
        });
        return;
      }
    }
    const registration = typeof values.registrationNumber === "string" ? values.registrationNumber.trim() : "";
    setIdentity({
      ...values,
      market,
      // Never claim verification we have not done: registration is stored as unverified.
      ...(registration ? { registrationStatus: "unverified" } : {}),
    });
    onSubmit();
  }

  const fields = fieldsFor(role, market);

  return (
    <Form {...form}>
      <form
        id="identity-form"
        onSubmit={form.handleSubmit(submit)}
        className="grid gap-4 animate-in fade-in duration-200 sm:grid-cols-2"
      >
        {fields.map((spec) => (
          <FormField
            key={spec.name}
            control={form.control}
            name={spec.name}
            render={({ field }) => (
              <FormItem className={spec.half ? undefined : "sm:col-span-2"}>
                <FormLabel>{spec.label}</FormLabel>
                {spec.options ? (
                  <Select value={String(field.value ?? "")} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger aria-label={spec.label}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {spec.options.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input
                      type={spec.type ?? "text"}
                      placeholder={spec.placeholder}
                      autoComplete={spec.type === "email" ? "email" : spec.type === "tel" ? "tel" : undefined}
                      {...field}
                      value={String(field.value ?? "")}
                    />
                  </FormControl>
                )}
                {spec.hint ? <FormDescription>{spec.hint}</FormDescription> : null}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </form>
    </Form>
  );
}
