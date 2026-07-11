import type { Metadata } from "next";

import { AudiencePage } from "@/components/marketing/AudienceHero";

export const metadata: Metadata = {
  title: "For Patients",
  description: "Your Health. Understood. Supported. Always. — Health Companion and Voice Care for patients invited by their NHS practice.",
};

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
    <AudiencePage
      kicker="For Patients"
      title="Your Health. Understood. Supported. Always."
      description="For patients invited to Aksh Health by their GP practice — a Health Companion that keeps you connected to your care team between appointments."
    >
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <article className="rounded-2xl border border-border p-8">
            <h2 className="text-xl font-bold text-navy">Health Companion</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm text-slate">
                  <span className="text-accent">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </article>

          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-6">
            <h3 className="font-bold text-navy">Voice Care</h3>
            <p className="mt-2 text-sm text-steel">
              Your care team never stops looking after you — even between appointments. If your health changes, someone
              will call.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald/20 bg-emerald/5 p-6">
            <h3 className="font-bold text-emerald">Privacy</h3>
            <p className="mt-2 text-sm text-steel">
              Your data stays within your NHS trust. You control what the AI sees. You can opt out of AI-assisted care
              at any time.
            </p>
          </div>

          <p className="mt-10 text-center text-lg font-semibold text-navy">Ask your GP practice if they use Aksh Health</p>
        </div>
      </section>
    </AudiencePage>
  );
}
