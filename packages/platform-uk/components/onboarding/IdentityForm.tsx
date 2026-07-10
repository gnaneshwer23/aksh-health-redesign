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
import { verifyNhsNumber } from "@/lib/onboarding/nhs-number";
import { useOnboardingStore } from "@/lib/onboarding/store";
import type { UserRole } from "@/lib/onboarding/roles";
import { getIdentitySchema } from "@/lib/onboarding/validation";
import {
  verifyGmc,
  verifyGphc,
  verifyNmc,
} from "@/lib/onboarding/verifications";

type IdentityFormProps = {
  role: UserRole;
  onSubmit: () => void;
};

export function IdentityForm({ role, onSubmit }: IdentityFormProps) {
  const identity = useOnboardingStore((s) => s.identity);
  const setIdentity = useOnboardingStore((s) => s.setIdentity);
  const verificationStatus = useOnboardingStore((s) => s.verificationStatus);
  const setVerificationStatus = useOnboardingStore((s) => s.setVerificationStatus);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const schema = getIdentitySchema(role);
  type FormValues = Record<string, unknown>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: identity as FormValues,
    mode: "onChange",
  });

  async function handleCredentialVerify(
    key: string,
    value: string,
    verifier: (v: string) => Promise<string>
  ) {
    setVerificationStatus(key, "pending");
    setVerifyMessage(null);
    try {
      const message = await verifier(value);
      setVerificationStatus(key, "verified");
      setVerifyMessage(message);
    } catch {
      setVerificationStatus(key, "error");
      setVerifyMessage("Verification failed — check the number format");
    }
  }

  function submit(values: FormValues) {
    setIdentity(values as Record<string, unknown>);
    onSubmit();
  }

  const isPatient = role === "patient";

  return (
    <Form {...form}>
      <form
        id="identity-form"
        onSubmit={form.handleSubmit(submit)}
        className="space-y-4 animate-in fade-in duration-200"
      >
        {isPatient ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} value={String(field.value ?? "")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} value={String(field.value ?? "")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of birth</FormLabel>
                  <FormControl>
                      <Input type="date" {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nhsNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NHS number</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input maxLength={10} placeholder="10 digits" {...field} value={String(field.value ?? "")} />
                    </FormControl>
                    <button
                      type="button"
                      className="rounded-sm border border-border px-3 text-sm"
                      disabled={verificationStatus.nhs === "pending"}
                      onClick={async () => {
                        const result = await verifyNhsNumber(String(field.value ?? ""));
                        setVerifyMessage(result.message);
                        setVerificationStatus(
                          "nhs",
                          result.valid ? "verified" : "error"
                        );
                      }}
                    >
                      {verificationStatus.nhs === "pending" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ) : (
          <>
            <FormField
              control={form.control}
              name={"fullName" as keyof FormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input {...field} value={String(field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {role === "gp" ? (
              <FormField
                control={form.control}
                name={"gmcNumber" as keyof FormValues}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GMC number</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input maxLength={7} {...field} value={String(field.value ?? "")} />
                      </FormControl>
                      <button
                        type="button"
                        className="rounded-sm border border-border px-3 text-sm"
                        onClick={() =>
                          handleCredentialVerify("gmc", String(field.value), verifyGmc)
                        }
                      >
                        {verificationStatus.gmc === "pending" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Verify"
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {role === "nurse" ? (
              <FormField
                control={form.control}
                name={"nmcNumber" as keyof FormValues}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NMC number</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="12A3456B" {...field} value={String(field.value ?? "")} />
                      </FormControl>
                      <button
                        type="button"
                        className="rounded-sm border border-border px-3 text-sm"
                        onClick={() =>
                          handleCredentialVerify("nmc", String(field.value), verifyNmc)
                        }
                      >
                        Verify
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {role === "clinical-pharmacist" ? (
              <FormField
                control={form.control}
                name={"gphcNumber" as keyof FormValues}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GPhC number</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input maxLength={7} {...field} value={String(field.value ?? "")} />
                      </FormControl>
                      <button
                        type="button"
                        className="rounded-sm border border-border px-3 text-sm"
                        onClick={() =>
                          handleCredentialVerify("gphc", String(field.value), verifyGphc)
                        }
                      >
                        Verify
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {(role === "gp" || role === "nurse" || role === "clinical-pharmacist") && (
              <FormField
                control={form.control}
                name={"nhsEmail" as keyof FormValues}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NHS email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={String(field.value ?? "")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {role === "practice-manager" && (
              <>
                <FormField
                  control={form.control}
                  name={"workEmail" as keyof FormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={String(field.value ?? "")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={"jobTitle" as keyof FormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job title</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? "")} />
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
                  name={"orgEmail" as keyof FormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organisation email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={String(field.value ?? "")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={"jobTitle" as keyof FormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job title</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? "")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={"icsName" as keyof FormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ICS name</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? "")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={"nhsDigitalRef" as keyof FormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NHS Digital reference (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? "")} />
                      </FormControl>
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
                  name={"workEmail" as keyof FormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={String(field.value ?? "")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={"jobTitle" as keyof FormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job title</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={String(field.value ?? "")}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["CEO", "COO", "CMO", "CFO", "CIO", "Other"].map((title) => (
                            <SelectItem key={title} value={title}>
                              {title}
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
                  name={"trustName" as keyof FormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospital trust name</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? "")} />
                      </FormControl>
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
                  name={"institutionalEmail" as keyof FormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institutional email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={String(field.value ?? "")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={"institutionName" as keyof FormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution name</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? "")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={"orcid" as keyof FormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ORCID (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? "")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {role !== "researcher" && role !== "ics-lead" && role !== "practice-manager" && role !== "hospital-executive" && (
              <FormField
                control={form.control}
                name={"mobile" as keyof FormValues}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile (MFA)</FormLabel>
                    <FormControl>
                      <Input {...field} value={String(field.value ?? "")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(role === "practice-manager" || role === "hospital-executive") && (
              <FormField
                control={form.control}
                name={"mobile" as keyof FormValues}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl>
                      <Input {...field} value={String(field.value ?? "")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        {verifyMessage ? (
          <p
            className={
              verificationStatus.gmc === "error" ||
              verificationStatus.nmc === "error" ||
              verificationStatus.gphc === "error" ||
              verificationStatus.nhs === "error"
                ? "text-sm text-danger"
                : "text-sm text-accent"
            }
          >
            {verifyMessage}
          </p>
        ) : null}
      </form>
    </Form>
  );
}
