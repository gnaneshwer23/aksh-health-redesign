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
import { ICS_REGIONS } from "@/lib/access-requests/validation";
import type { UserRole } from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";
import { ORG_EHR_OPTIONS, getOrgSchema } from "@/lib/onboarding/validation";

type OrgFormProps = {
  role: UserRole;
  onSubmit: () => void;
};

const ORG_NAME_LABEL: Partial<Record<UserRole, string>> = {
  "ics-lead": "Network, region or health system",
  "hospital-executive": "Hospital or health system",
  researcher: "Research institution",
};

export function OrgForm({ role, onSubmit }: OrgFormProps) {
  const organisation = useOnboardingStore((s) => s.organisation);
  const setOrganisation = useOnboardingStore((s) => s.setOrganisation);
  const schema = getOrgSchema(role);

  type FormValues = Record<string, unknown>;
  const form = useForm<FormValues>({
    resolver: schema ? (zodResolver(schema) as never) : undefined,
    defaultValues: { useSynthetic: true, ...(organisation as FormValues) },
    mode: "onChange",
  });

  const useSynthetic = form.watch("useSynthetic") !== false;

  function submit(values: FormValues) {
    setOrganisation(
      values.useSynthetic === false
        ? values
        : { useSynthetic: true, organisationName: "Aksh synthetic clinic" }
    );
    onSubmit();
  }

  return (
    <Form {...form}>
      <form id="org-form" onSubmit={form.handleSubmit(submit)} className="space-y-5 animate-in fade-in duration-200">
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Workspace">
          {[
            {
              value: true,
              title: "Start in the synthetic clinic",
              body: "500 fictional patients, 100 professionals, 20 pharmacies. Ready now.",
            },
            {
              value: false,
              title: "Describe my organisation",
              body: "Still synthetic data today. Helps us prepare when your organisation goes live.",
            },
          ].map((option) => {
            const checked = useSynthetic === option.value;
            return (
              <button
                key={String(option.value)}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => form.setValue("useSynthetic", option.value, { shouldValidate: true })}
                className={
                  checked
                    ? "rounded-2xl border-2 border-secondary bg-secondary/5 p-4 text-left"
                    : "rounded-2xl border border-border-subtle bg-white p-4 text-left hover:border-secondary/40"
                }
              >
                <span className="block text-sm font-semibold text-foreground">{option.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">{option.body}</span>
              </button>
            );
          })}
        </div>

        {useSynthetic ? null : (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="organisationName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{ORG_NAME_LABEL[role] ?? "Clinic or organisation name"}</FormLabel>
                  <FormControl>
                    <Input {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="organisationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisation identifier (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="ODS, NPI, facility or licence ID" {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormDescription>Stored as provided; not verified yet.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ehrSystem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EHR in use (optional)</FormLabel>
                  <Select value={String(field.value ?? "")} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger aria-label="EHR in use">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ORG_EHR_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Region (optional)</FormLabel>
                  <Select value={String(field.value ?? "")} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger aria-label="Region">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ICS_REGIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </form>
    </Form>
  );
}
