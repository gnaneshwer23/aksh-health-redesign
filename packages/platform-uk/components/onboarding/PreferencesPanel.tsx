"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";
import { getPreferencesSchema } from "@/lib/onboarding/validation";

type PreferencesPanelProps = {
  role: UserRole;
  onSubmit: () => void;
};

function RadioOptions({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-2">
      {options.map((option) => (
        <div key={option} className="flex items-center space-x-2">
          <RadioGroupItem value={option} id={option} />
          <Label htmlFor={option}>{option}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}

export function PreferencesPanel({ role, onSubmit }: PreferencesPanelProps) {
  const preferences = useOnboardingStore((s) => s.preferences);
  const setPreferences = useOnboardingStore((s) => s.setPreferences);

  const schema = getPreferencesSchema(role);
  if (!schema) return null;

  type FormValues = Record<string, unknown>;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: preferences as FormValues,
    mode: "onChange",
  });

  const billingContact = form.watch("billingContact");

  function submit(values: FormValues) {
    setPreferences(values as Record<string, unknown>);
    onSubmit();
  }

  const fields: Array<{
    name: keyof FormValues;
    label: string;
    options: string[];
    type?: "number";
  }> = [];

  if (role === "gp") {
    fields.push(
      { name: "synthesisLength" as keyof FormValues, label: "SYNTHESIS summary length", options: ["Brief", "Standard", "Detailed"] },
      { name: "oracleAlerts" as keyof FormValues, label: "HORIZON alerts", options: ["All patients", "High risk only", "Off"] },
      { name: "guardianSensitivity" as keyof FormValues, label: "GUARDIAN sensitivity", options: ["All interactions", "Severe only"] },
      { name: "voiceAgent" as keyof FormValues, label: "VOICE agent", options: ["On", "Off"] },
      { name: "equityReports" as keyof FormValues, label: "COMPASS reports", options: ["Monthly", "Quarterly", "Off"] },
      { name: "dailyDigest" as keyof FormValues, label: "Daily digest time", options: ["7am", "8am", "9am", "Off"] }
    );
  } else if (role === "nurse") {
    fields.push(
      { name: "guardianAlerts" as keyof FormValues, label: "GUARDIAN alerts", options: ["All", "Drug interactions only", "Off"] },
      { name: "voiceDictation" as keyof FormValues, label: "VOICE dictation", options: ["On", "Off"] },
      { name: "handoverSummary" as keyof FormValues, label: "Handover summary", options: ["Auto at shift end", "Manual"] },
      { name: "equityFlags" as keyof FormValues, label: "COMPASS flags", options: ["Show", "Hide"] }
    );
  } else if (role === "clinical-pharmacist") {
    fields.push(
      { name: "bnfAlerts" as keyof FormValues, label: "BNF alerts", options: ["All", "Severe only", "Off"] },
      { name: "medReconciliation" as keyof FormValues, label: "Medication reconciliation", options: ["Auto-flag", "Manual"] },
      { name: "guardianSensitivity" as keyof FormValues, label: "GUARDIAN sensitivity", options: ["High", "Standard"] },
      { name: "interactionDisplay" as keyof FormValues, label: "Interaction display", options: ["Inline", "Separate panel"] }
    );
  } else if (role === "practice-manager") {
    fields.push(
      { name: "equityReports" as keyof FormValues, label: "COMPASS reports", options: ["Monthly", "Quarterly", "Off"] },
      { name: "extractionAlerts" as keyof FormValues, label: "Extraction job alerts", options: ["Email on failure", "None"] },
      { name: "billingContact" as keyof FormValues, label: "Billing contact", options: ["Same as me", "Different person"] },
      { name: "newUserInvitations" as keyof FormValues, label: "New user invitations", options: ["Require admin approval", "Auto-approve"] }
    );
  } else if (role === "ics-lead") {
    fields.push(
      { name: "imdOverlay" as keyof FormValues, label: "IMD overlay", options: ["On", "Off"] },
      { name: "frailtyCohort" as keyof FormValues, label: "Frailty cohort", options: ["On", "Off"] },
      { name: "crossPracticeBenchmarking" as keyof FormValues, label: "Cross-practice benchmarking", options: ["On", "Off"] },
      { name: "digitalTwinHospital" as keyof FormValues, label: "Risk-state hospital demand (scaffolding)", options: ["On", "Off"] },
      { name: "reportCadence" as keyof FormValues, label: "Report cadence", options: ["Monthly board pack", "Quarterly", "Manual"] },
      { name: "aiAdoptionAlert" as keyof FormValues, label: "AI adoption < 50% alert", options: ["On", "Off"] }
    );
  } else if (role === "hospital-executive") {
    fields.push(
      { name: "bedManagementAlerts" as keyof FormValues, label: "Bed management alerts", options: ["On", "Off"] },
      { name: "staffingAlerts" as keyof FormValues, label: "Staffing alerts", options: ["On", "Off"] },
      { name: "edWaitingThreshold" as keyof FormValues, label: "ED waiting threshold (hours)", options: [], type: "number" },
      { name: "digitalTwinWinter" as keyof FormValues, label: "Risk-state winter surge (scaffolding)", options: ["On", "Off"] },
      { name: "theatreOptimisation" as keyof FormValues, label: "Theatre optimisation", options: ["On", "Off"] },
      { name: "reportCadence" as keyof FormValues, label: "Report cadence", options: ["Daily executive briefing", "Weekly", "Monthly"] }
    );
  } else if (role === "researcher") {
    fields.push(
      { name: "dataAccessLevel" as keyof FormValues, label: "Data access level", options: ["Aggregate (anonymised) only", "Individual (requires ethics)"] },
      { name: "reportFormat" as keyof FormValues, label: "Report format", options: ["CSV", "API", "Dashboard"] }
    );
  }

  return (
    <Form {...form}>
      <form
        id="preferences-form"
        onSubmit={form.handleSubmit(submit)}
        className="space-y-6 animate-in fade-in duration-200"
      >
        {fields.map((fieldDef) => (
          <FormField
            key={String(fieldDef.name)}
            control={form.control}
            name={fieldDef.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fieldDef.label}</FormLabel>
                <FormControl>
                  {fieldDef.type === "number" ? (
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={String(field.value ?? "")}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  ) : (
                    <RadioOptions
                      options={fieldDef.options}
                      value={String(field.value ?? fieldDef.options[0])}
                      onChange={field.onChange}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        {role === "practice-manager" && billingContact === "Different person" && (
          <>
            <FormField
              control={form.control}
              name={"billingContactName" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing contact name</FormLabel>
                  <FormControl>
                    <Input {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={"billingContactEmail" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing contact email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} value={String(field.value ?? "")} />
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
