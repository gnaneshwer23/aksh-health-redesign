"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";

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
import { useProofEnvironment, useRealWorkspace } from "@/components/workspace/WorkspaceMode";
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
  // Real workspace: no sandbox clinic with sample patients; set up your own (empty) clinic or join one.
  const real = useRealWorkspace();
  const proof = useProofEnvironment();

  type FormValues = Record<string, unknown>;
  const form = useForm<FormValues>({
    resolver: schema ? (zodResolver(schema) as never) : undefined,
    defaultValues: real ? { ...(organisation as FormValues), useSynthetic: false } : { useSynthetic: true, ...(organisation as FormValues) },
    mode: "onChange",
  });

  const useSynthetic = form.watch("useSynthetic") !== false;
  const joining = form.watch("join") === true;
  const joinedOrganisationId = form.watch("joinedOrganisationId") as string | undefined;
  const mode = joining ? "join" : useSynthetic ? "sandbox" : "describe";
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinBusy, setJoinBusy] = useState(false);

  function choose(next: "sandbox" | "describe" | "join") {
    form.setValue("join", next === "join", { shouldValidate: true });
    form.setValue("useSynthetic", next !== "describe", { shouldValidate: true });
  }

  async function join() {
    setJoinBusy(true);
    setJoinError(null);
    const res = await fetch("/api/invites/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const data = (await res.json().catch(() => ({}))) as { organisationId?: string; error?: string };
    setJoinBusy(false);
    if (res.ok && data.organisationId) form.setValue("joinedOrganisationId", data.organisationId, { shouldValidate: true });
    else setJoinError(data.error ?? "That code did not work. Check it with your organisation admin.");
  }

  function submit(values: FormValues) {
    setOrganisation(
      values.join === true
        ? { join: true, joinedOrganisationId: values.joinedOrganisationId }
        : values.useSynthetic === false
          ? values
          : { useSynthetic: true, organisationName: "Aksh sandbox clinic" }
    );
    onSubmit();
  }

  return (
    <Form {...form}>
      <form id="org-form" onSubmit={form.handleSubmit(submit)} className="space-y-5 animate-in fade-in duration-200">
        <div className={real || proof ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-3"} role="radiogroup" aria-label="Workspace">
          {(real
            ? [
                { value: "describe" as const, title: "Set up my clinic", body: "Your clinic's own workspace. Add staff and patients yourself." },
                { value: "join" as const, title: "I have an invite code", body: "Join the clinic that invited you." },
              ]
            : [
            {
              value: "sandbox" as const,
              title: "Start in the sandbox clinic",
              body: "A full test clinic with patients, care team and pharmacy. Ready now."
            },
            // The clinical-proof environment holds the synthetic sandbox clinic only.
            ...(proof
              ? []
              : [
                  {
                    value: "describe" as const,
                    title: "Describe my organisation",
                    body: "Your own workspace, empty. Add staff and patients yourself.",
                  },
                ]),
            {
              value: "join" as const,
              title: "I have an invite code",
              body: "Join the organisation that invited you.",
            },
          ]).map((option) => {
            const checked = mode === option.value;
            return (
              <button
                key={String(option.value)}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => choose(option.value)}
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

        {mode === "join" ? (
          <div className="space-y-2" data-join-with-code>
            <label className="block text-sm font-medium text-foreground" htmlFor="invite-code">Staff invite code</label>
            <div className="flex flex-wrap gap-2">
              <Input id="invite-code" className="max-w-xs" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD-EFGH-JKLM-NPQR" disabled={Boolean(joinedOrganisationId)} />
              <Button type="button" onClick={() => void join()} disabled={joinBusy || code.trim().length < 8 || Boolean(joinedOrganisationId)}>
                {joinedOrganisationId ? "Joined" : joinBusy ? "Joining…" : "Join"}
              </Button>
            </div>
            {joinedOrganisationId ? <p className="text-sm text-secondary" role="status">You have joined. Continue to finish setting up.</p> : null}
            {joinError ? <p className="text-sm text-red-700" role="alert">{joinError}</p> : null}
            {form.formState.errors.inviteCode && !joinedOrganisationId ? (
              <p className="text-sm text-red-700">{String(form.formState.errors.inviteCode.message ?? "")}</p>
            ) : null}
          </div>
        ) : null}

        {mode !== "describe" ? null : (
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
                    <Input placeholder="Registration, facility or licence ID" {...field} value={String(field.value ?? "")} />
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
