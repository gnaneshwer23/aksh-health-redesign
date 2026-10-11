"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UserRole } from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";
import { getConsentSchema } from "@/lib/onboarding/validation";
import { useRealWorkspace } from "@/components/workspace/WorkspaceMode";
import { cn } from "@/lib/utils";

type ConsentFormProps = {
  role: UserRole;
  onSubmit: () => void;
};

const CONSENT_COPY: Record<
  UserRole,
  Array<{ key: string; label: string; required: boolean }>
> = {
  gp: [
    { key: "aiDocumentation", label: "I consent to AI-assisted clinical documentation", required: true },
    { key: "hitlApproval", label: "I understand AI outputs require my approval before FHIR write", required: true },
    { key: "dcb0129", label: "I understand clinical safety rehearsal applies — not a signed clinical safety case", required: true },
    { key: "anonymisedOutcomes", label: "I consent to anonymised outcome data improving the model", required: false },
  ],
  nurse: [
    { key: "aiDocumentation", label: "I consent to AI-assisted care documentation", required: true },
    { key: "hitlApproval", label: "I understand AI outputs require my approval before patient record updates", required: true },
    { key: "dcb0129", label: "I understand clinical safety rehearsal applies — not a signed clinical safety case", required: true },
    { key: "anonymisedOutcomes", label: "I consent to anonymised outcome data improving the model", required: false },
  ],
  "clinical-pharmacist": [
    { key: "aiDocumentation", label: "I consent to AI-assisted medication review documentation", required: true },
    { key: "hitlApproval", label: "I understand AI outputs require my approval before FHIR write", required: true },
    { key: "dcb0129", label: "I understand clinical safety rehearsal applies — not a signed clinical safety case", required: true },
    { key: "anonymisedOutcomes", label: "I consent to anonymised outcome data improving the model", required: false },
  ],
  "practice-manager": [
    { key: "dpa", label: "I accept the Data Processing Agreement for my clinic as data controller", required: true },
    { key: "dspt", label: "I understand healthcare data security obligations apply for this organisation — this checkbox is not a completed toolkit submission", required: true },
    { key: "ehrIntegration", label: "I consent to EHR staging on behalf of the organisation (no live write-back to the EHR)", required: true },
  ],
  "ics-lead": [
    { key: "dataSharing", label: "I accept data sharing terms across clinics in my regional boundary", required: true },
    { key: "pseudonymised", label: "I understand population data is pseudonymised", required: true },
    { key: "pilotEvaluation", label: "I agree to clinical evaluation requirements for this pilot", required: true },
  ],
  "hospital-executive": [
    { key: "enterpriseDpa", label: "I accept the Enterprise Data Processing Agreement", required: true },
    { key: "gdprController", label: "I confirm data-protection controller responsibilities under the law that applies to my organisation", required: true },
  ],
  patient: [
    { key: "healthContact", label: "I agree to Aksh Health contacting me about my health", required: true },
    { key: "gpApproval", label: "I understand my care team approves all AI suggestions", required: true },
    { key: "careImprovement", label: "I consent to my health data being used to improve my care", required: false },
    { key: "voiceCalls", label: "I consent to voice calls for post-appointment check-ins", required: false },
  ],
  researcher: [
    { key: "dataGovernance", label: "I accept the research data governance terms", required: true },
    { key: "ethicsCompliance", label: "I confirm ethics board compliance for my data access level", required: true },
  ],
};

/** Real workspace: acknowledgements about the product people actually use (no AI drafting, no EHR staging). */
const REAL_CONSENT_STAFF = [
  { key: "authorised", label: "I am authorised to use Aksh for my organisation's patients", required: true },
  { key: "dataProtection", label: "I will handle patient information under my organisation's data protection and confidentiality policies", required: true },
  { key: "staffDecide", label: "I understand Aksh ranks and drafts, and that staff decide and make every patient contact", required: true },
];
const REAL_CONSENT_PATIENT = [
  { key: "healthData", label: "I agree to Aksh storing the readings and details I add to my account", required: true },
  { key: "notEmergency", label: "I understand my care team checks what I share, but not around the clock: in an emergency I will call the emergency number", required: true },
  { key: "clinicContact", label: "My clinic may contact me about my care and appointments", required: false },
];
const realSchema = (items: { key: string; required: boolean }[]) =>
  z.object(Object.fromEntries(items.map((i) => [i.key, i.required ? z.literal(true, { message: "Required" }) : z.boolean().optional()])));

export function ConsentForm({ role, onSubmit }: ConsentFormProps) {
  const consents = useOnboardingStore((s) => s.consents);
  const setConsents = useOnboardingStore((s) => s.setConsents);
  const organisation = useOnboardingStore((s) => s.organisation);

  const real = useRealWorkspace();
  const items = real ? (role === "patient" ? REAL_CONSENT_PATIENT : REAL_CONSENT_STAFF) : CONSENT_COPY[role];
  const schema = real ? realSchema(items) : getConsentSchema(role);
  type FormValues = Record<string, boolean | undefined>;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: consents as FormValues,
    mode: "onChange",
  });

  const isPatient = role === "patient";
  const practiceCount = organisation.practicesInScope ?? "your";

  function submit(values: FormValues) {
    setConsents(values as Record<string, boolean>);
    onSubmit();
  }

  return (
    <Form {...form}>
      <form
        id="consent-form"
        onSubmit={form.handleSubmit(submit)}
        className={cn(
          "space-y-4 animate-in fade-in duration-200",
          isPatient && "text-base"
        )}
      >
        {items.map((item) => {
          const label =
            item.key === "dataSharing" && organisation.practicesInScope
              ? `I accept data sharing terms across ${organisation.practicesInScope} clinics in my regional boundary`
              : item.label;

          return (
            <FormField
              key={item.key}
              control={form.control}
              name={item.key as keyof FormValues}
              render={({ field }) => (
                <FormItem className="flex items-start gap-3 space-y-0 rounded-md border border-border p-4">
                  <FormControl>
                    <Checkbox
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className={cn(isPatient && "text-base font-medium")}>
                      {label}
                      {item.required ? " (required)" : " (optional)"}
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          );
        })}
        {role === "ics-lead" && !organisation.practicesInScope ? (
          <p className="text-sm text-muted">
            Data sharing covers {String(practiceCount)} clinics in your regional boundary.
          </p>
        ) : null}
        {!real && (role === "gp" ||
          role === "practice-manager" ||
          role === "patient" ||
          role === "ics-lead" ||
          role === "hospital-executive") && (
          <p
            className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted"
            data-testid="precision-health-consent-note"
          >
            After you finish onboarding, purpose and modality grants are written into the{" "}
            <strong className="font-medium text-foreground">consent registry</strong>
            {role === "practice-manager"
              ? " (Admin → Consent registry)."
              : role === "patient"
                ? " inside My Health."
                : " on patient detail / admin surfaces."}{" "}
            Same store as Precision Health — not live twin or EMR write-back consent.
          </p>
        )}
      </form>
    </Form>
  );
}
