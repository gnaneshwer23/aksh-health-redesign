"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
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
import { Checkbox } from "@/components/ui/checkbox";
import type { UserRole } from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";
import { getOrgSchema } from "@/lib/onboarding/validation";
import { lookupOdsCode } from "@/lib/onboarding/verifications";

type OrgFormProps = {
  role: UserRole;
  onSubmit: () => void;
};

const ICS_REGIONS = [
  "South East London",
  "West Yorkshire",
  "Greater Manchester",
  "Birmingham and Solihull",
  "Other",
];

const EHR_OPTIONS = ["EMIS Web", "SystmOne", "Other"] as const;
const EHR_MIX = ["EMIS Web", "SystmOne", "Mixed", "Other"] as const;

export function OrgForm({ role, onSubmit }: OrgFormProps) {
  const organisation = useOnboardingStore((s) => s.organisation);
  const setOrganisation = useOnboardingStore((s) => s.setOrganisation);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [lookupPending, setLookupPending] = useState(false);

  const schema = getOrgSchema(role);
  if (!schema) return null;

  type FormValues = Record<string, unknown>;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: organisation as FormValues,
    mode: "onChange",
  });

  async function handleOdsLookup(code: string) {
    setLookupPending(true);
    const result = await lookupOdsCode(code);
    setLookupMessage(result.message);
    if (result.found) {
      if (result.name && "practiceName" in form.getValues()) {
        form.setValue("practiceName" as keyof FormValues, result.name as never);
      }
      if (result.ehr && "ehrSystem" in form.getValues()) {
        form.setValue("ehrSystem" as keyof FormValues, result.ehr as never);
      }
      if (result.ics && "icsRegion" in form.getValues()) {
        form.setValue("icsRegion" as keyof FormValues, result.ics as never);
      }
      if (result.beds && "numberOfBeds" in form.getValues()) {
        form.setValue("numberOfBeds" as keyof FormValues, result.beds as never);
      }
    }
    setLookupPending(false);
  }

  function submit(values: FormValues) {
    setOrganisation(values as Record<string, unknown>);
    onSubmit();
  }

  const odsFieldName =
    role === "ics-lead"
      ? "icsOdsCode"
      : role === "hospital-executive"
        ? "trustOdsCode"
        : "odsCode";

  const showOdsLookup = role !== "researcher";

  return (
    <Form {...form}>
      <form
        id="org-form"
        onSubmit={form.handleSubmit(submit)}
        className="space-y-4 animate-in fade-in duration-200"
      >
        {showOdsLookup ? (
          <FormField
            control={form.control}
            name={odsFieldName as keyof FormValues}
            render={({ field }) => (
              <FormItem>
                <FormLabel>ODS code</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input {...field} value={String(field.value ?? "")} placeholder="E81001" />
                  </FormControl>
                  <button
                    type="button"
                    className="rounded-sm border border-border px-3 text-sm"
                    onClick={() => handleOdsLookup(String(field.value))}
                  >
                    {lookupPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup"}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {lookupMessage ? <p className="text-sm text-muted">{lookupMessage}</p> : null}

        {role === "gp" && (
          <>
            <FormField
              control={form.control}
              name={"listSize" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>List size</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={String(field.value ?? "")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select list size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["<5,000", "5,000–10,000", "10,000–15,000", "15,000+"].map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
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
              name={"ehrSystem" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EHR system</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={String(field.value ?? "")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EHR_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
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
              name={"icsRegion" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ICS region</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={String(field.value ?? "")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ICS_REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {role === "nurse" && (
          <>
            <FormField
              control={form.control}
              name={"supervisingGp" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supervising GP name</FormLabel>
                  <FormControl>
                    <Input {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={"wardTeam" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ward / team</FormLabel>
                  <FormControl>
                    <Input {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {role === "clinical-pharmacist" && (
          <>
            <FormField
              control={form.control}
              name={"pcnAffiliation" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PCN affiliation</FormLabel>
                  <FormControl>
                    <Input {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={"ehrSystem" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EHR system</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={String(field.value ?? "")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EHR_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {role === "practice-manager" && (
          <>
            <FormField
              control={form.control}
              name={"practiceName" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Practice name</FormLabel>
                  <FormControl>
                    <Input {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={"icsRegion" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ICS region</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={String(field.value ?? "")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ICS_REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
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
              name={"numberOfGps" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of GPs</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {role === "ics-lead" && (
          <>
            <FormField
              control={form.control}
              name={"practicesInScope" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Practices in scope</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={"ehrMix" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EHR mix</FormLabel>
                  <div className="space-y-2">
                    {EHR_MIX.map((option) => {
                      const selected = (field.value as string[] | undefined) ?? [];
                      return (
                        <label key={option} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selected.includes(option)}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...selected, option]
                                : selected.filter((v) => v !== option);
                              field.onChange(next);
                            }}
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={"pilotCohort" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deployment phase</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={String(field.value ?? "")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["Phase 1", "Phase 2", "Observer"].map((cohort) => (
                        <SelectItem key={cohort} value={cohort}>
                          {cohort}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {role === "hospital-executive" && (
          <>
            <FormField
              control={form.control}
              name={"numberOfBeds" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of beds</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={"hospitalType" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hospital type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={String(field.value ?? "")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["Acute", "Mental Health", "Community", "Private"].map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name={"ehrSystem" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EHR system</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={String(field.value ?? "")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["Epic", "Oracle Health", "EMIS", "Other"].map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {role === "researcher" && (
          <>
            <FormField
              control={form.control}
              name={"researchInstitution" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Research institution</FormLabel>
                  <FormControl>
                    <Input {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={"ethicsBoardRef" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ethics board reference (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={"affiliatedTrust" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Affiliated NHS trust (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </form>
    </Form>
  );
}
