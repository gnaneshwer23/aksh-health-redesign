import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalloutBox } from "@/components/shared/CalloutBox";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "For Patients",
  "Your Health. Understood. Supported. Always. — Health Companion and Voice Care for patients invited by their NHS practice."
);

const features = [
  "Daily health check-ins and symptom tracking",
  "Medication reminders and adherence support",
  "Care plan view with upcoming tasks and appointments",
  "Secure messaging with your care team",
  "Appointment management and booking",
  "Lifestyle coaching tailored to your conditions",
];

export default function ForPatientsPage() {
  return (
    <>
      <section className="bg-navy-dark py-16 text-white lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            For Patients
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
            Your Health. Understood. Supported. Always.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            For patients invited to Aksh Health by their GP practice — a Health
            Companion that keeps you connected to your care team between
            appointments.
          </p>
        </div>
      </section>
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Health Companion</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm">
                    <span className="text-accent">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <CalloutBox title="Voice Care" variant="info" className="mt-6">
            Your care team never stops looking after you — even between
            appointments. If your health changes, someone will call.
          </CalloutBox>
          <CalloutBox title="Privacy" variant="success" className="mt-6">
            Your data stays within your NHS trust. You control what the AI sees.
            You can opt out of AI-assisted care at any time.
          </CalloutBox>
          <p className="mt-10 text-center text-lg font-semibold text-foreground">
            Ask your GP practice if they use Aksh Health
          </p>
        </div>
      </section>
    </>
  );
}
