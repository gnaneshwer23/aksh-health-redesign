"use client";

import { Mic } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveDashboardPath, type UserRole } from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";

type TutorialScreen = {
  title: string;
  body: string;
  visual: React.ReactNode;
  /** Final-screen label — always routes through /onboarding/complete via onComplete. */
  ctaLabel?: string;
};

function getGpScreens(doctorName: string): TutorialScreen[] {
  return [
    {
      title: "Everything AI Suggests. Nothing AI Decides.",
      body: "Capture → draft → approve is the heart of Aksh Health. Every AI output (SOAP notes, codes, drug alerts, risk scores) lands in your Review Queue as a draft. You Accept, Edit, or Reject. Only then can it reach the patient record.",
      visual: (
        <div className="space-y-2 rounded-md border border-border p-4 text-sm">
          {[
            "[SYNTHESIS] SOAP note: Mrs Johnson, T2D review",
            "[Dr.Assist] I82.4 DVT, 94% confidence",
            "[GUARDIAN] 🔴 Aspirin + Apixaban interaction",
          ].map((item) => (
            <div key={item} className="flex items-center justify-between rounded border border-border p-2">
              <span>{item}</span>
              <div className="flex gap-1">
                <Badge>Accept</Badge>
                <Badge variant="outline">Edit</Badge>
                <Badge variant="danger">Reject</Badge>
              </div>
            </div>
          ))}
          <p className="font-medium text-accent">3 items reviewed. 0 items auto-written.</p>
        </div>
      ),
    },
    {
      title: "From Dictation to SOAP Note in 4 Seconds.",
      body: "Click the microphone. Speak naturally. VOICE transcribes your consultation in real-time. SYNTHESIS converts it to a structured SOAP note and stages it for your approval.",
      visual: (
        <div className="space-y-3 rounded-md border border-border p-4">
          <div className="flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
              <Mic className="h-8 w-8" />
            </div>
          </div>
          <div className="h-8 rounded bg-border/60" />
          <div className="rounded border border-border p-3 text-sm">
            <strong>SOAP: T2D + DVT review</strong>
            <p className="mt-2 text-muted">
              S: Patient reports leg swelling, type 2 diabetes on metformin.
              O: BMI 31.4, prior DVT history noted.
              A: T2D review due; consider anticoagulation interaction.
              P: Medication review, HbA1c, retinal screening referral.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Drug Interaction Checking Happens Before You Prescribe.",
      body: "The moment you consider adding a new medication, GUARDIAN cross-checks it against every current medication, allergy, and contraindication, using the BNF as its source of truth.",
      visual: (
        <div className="space-y-2 text-sm">
          <div className="rounded border border-danger/30 bg-danger/5 p-3">🔴 Contraindicated: Apixaban + Aspirin, HIGH risk</div>
          <div className="rounded border border-warning/30 bg-warning/5 p-3">🟠 Monitor closely: Apixaban + NSAIDs, MEDIUM risk</div>
          <div className="rounded border border-accent/30 bg-accent/5 p-3">🟢 No interaction: Apixaban + Metformin, SAFE</div>
        </div>
      ),
    },
    {
      title: "Your highest-risk patients. Identified automatically.",
      body: "HORIZON analyses each patient's full clinical record (conditions, medications, history, social determinants) and generates a risk score with contributing factors you can act on.",
      visual: (
        <div className="rounded-md border border-border p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-danger text-xl font-bold text-danger">
              82
            </div>
            <div className="text-sm">
              <p className="font-semibold">Margaret T., risk 82/100</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-muted">
                <li>DVT + Diabetes combination</li>
                <li>Aspirin prescribed with anticoagulant risk</li>
                <li>Missed medication review (12 months)</li>
                <li>BMI 31.4</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "AI coordinates the follow-up so you don't have to.",
      body: "When HORIZON flags a patient, Aksh Health drafts the care pathway: booking reviews, arranging screening, notifying the team. All steps await your confirmation.",
      visual: (
        <ol className="space-y-2 border-l-2 border-primary pl-4 text-sm">
          {[
            "HbA1c threshold triggered → AI detected",
            "Review appointment → Voice agent books",
            "Retinal screening → Referral created",
            "Medication review → Dr.Assist prepared",
            "GP approval → Approve All / Review Each",
          ].map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ),
    },
    {
      title: `You're Ready, Dr ${doctorName}`,
      body: "Your Clinician Dashboard is next: Review Queue, today's patients, and patient panels for risk state, timeline, and health-plan drafts — all HITL. Precision Health features are scaffolding, not a live twin.",
      visual: (
        <ul className="space-y-1 text-sm text-accent">
          {[
            "Review Queue: Capture → draft → approve",
            "HORIZON risk scores on today's list",
            "Patient detail: risk state · timeline · plan draft",
            "Walkthrough & resources linked from the dashboard",
          ].map((line) => (
            <li key={line}>✓ {line}</li>
          ))}
        </ul>
      ),
      ctaLabel: "Continue to complete",
    },
  ];
}

function getIcsScreens(): TutorialScreen[] {
  return [
    {
      title: "Population Intelligence Overview",
      body: "Monitor ICS-wide metrics: total patients, AI actions, risk cohorts, and equity flags from a single command view.",
      visual: (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {["2.4M patients", "18.2k AI actions", "12 risk cohorts", "847 equity flags"].map((metric) => (
            <div key={metric} className="rounded border border-border p-3 font-medium">
              {metric}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Cross-Practice Benchmarking",
      body: "Compare AI adoption, queue clearance, and alert volumes across practices in your ICS.",
      visual: (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2">Practice</th>
              <th>AI adoption</th>
              <th>Queue clearance</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Oakfield Surgery", "72%", "94%"],
              ["Harrogate MC", "68%", "91%"],
              ["Riverside PCN", "55%", "88%"],
              ["Northgate Health", "49%", "85%"],
              ["Valley Practice", "61%", "90%"],
            ].map(([name, adoption, clearance]) => (
              <tr key={name} className="border-b border-border">
                <td className="py-2">{name}</td>
                <td>{adoption}</td>
                <td>{clearance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
    {
      title: "Population risk state (scaffolding)",
      body: "Model surge scenarios for winter planning. This is aggregate risk-state scaffolding on rehearsal data — not a physiological digital twin or live ICS feed.",
      visual: (
        <div className="rounded-md border border-border p-4 text-sm">
          <p className="font-medium">Simulation: +20% admissions</p>
          <p className="mt-2 text-muted">Predicted bed occupancy: 94% (critical threshold 92%)</p>
          <p className="text-muted">Recommended: open 12 surge beds, defer 8 elective lists</p>
        </div>
      ),
    },
    {
      title: "You're Ready",
      body: "Next: ICS Population Intelligence — KPIs, equity flags, benchmarking, and Risk state / forecast.",
      visual: <p className="text-sm text-accent">✓ ICS dashboard preview matches what you&apos;ll open after complete</p>,
      ctaLabel: "Continue to complete",
    },
  ];
}

function getHospitalScreens(): TutorialScreen[] {
  return [
    {
      title: "Hospital Command Centre",
      body: "Real-time ED waiting times, bed occupancy, and staffing alerts in one executive view.",
      visual: (
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded border border-border p-3">ED wait: 3.2h</div>
          <div className="rounded border border-border p-3">Beds: 89%</div>
          <div className="rounded border border-warning/40 bg-warning/10 p-3">Staffing alert</div>
        </div>
      ),
    },
    {
      title: "Risk state scaffolding",
      body: "Winter surge simulation and discharge bottleneck views for capacity planning — synthetic rehearsal, not a live PAS twin.",
      visual: (
        <div className="space-y-2 text-sm">
          <p>Winter surge: +18% admissions projected</p>
          <p className="text-muted">Discharge bottleneck: Ward 4, avg 2.1 day delay</p>
        </div>
      ),
    },
    {
      title: "You're Ready",
      body: "Next: Hospital Command Centre with ED/beds/staffing metrics and a Risk state panel when you need it.",
      visual: <p className="text-sm text-accent">✓ Command Centre preview ready — complete onboarding to open it</p>,
      ctaLabel: "Continue to complete",
    },
  ];
}

function getPatientScreens(): TutorialScreen[] {
  return [
    {
      title: "My Health",
      body: "See your conditions, medications, and care plan in plain English, always approved by your GP.",
      visual: (
        <div className="space-y-2 text-sm">
          <p><strong>Conditions:</strong> Type 2 diabetes, previous DVT</p>
          <p><strong>Medications:</strong> Metformin, Apixaban</p>
          <p><strong>Care plan:</strong> Annual diabetes review, medication check</p>
        </div>
      ),
    },
    {
      title: "AI Check-ins",
      body: "Every few days, we'll ask how you're doing. You can reply by text, app, or we can call.",
      visual: (
        <div className="rounded-md border border-border p-4 text-sm">
          <p>"How are you feeling today?"</p>
          <p className="mt-2 text-muted">Reply: Good / Okay / Need help</p>
        </div>
      ),
    },
    {
      title: "Ask Aksh",
      body: "Type any health question. The AI will answer and, if important, flag it to your care team for GP review.",
      visual: (
        <div className="rounded-md border border-border p-4 text-sm">
          <p className="text-muted">You: &quot;Is it normal to feel tired after starting new medication?&quot;</p>
          <p className="mt-2">AI: &quot;Fatigue can occur. I&apos;ll note this for your GP to review.&quot;</p>
        </div>
      ),
      ctaLabel: "Continue to complete",
    },
  ];
}

function getScreens(role: UserRole, identity: Record<string, unknown>): TutorialScreen[] {
  const doctorName =
    String(identity.fullName ?? "Smith")
      .split(" ")
      .pop() ?? "Smith";

  switch (role) {
    case "gp":
      return getGpScreens(doctorName);
    case "ics-lead":
      return getIcsScreens();
    case "hospital-executive":
      return getHospitalScreens();
    case "patient":
      return getPatientScreens();
    default:
      return [];
  }
}

type TutorialPlayerProps = {
  role: UserRole;
  onComplete: () => void;
};

export function TutorialPlayer({ role, onComplete }: TutorialPlayerProps) {
  const identity = useOnboardingStore((s) => s.identity);
  const tutorialScreen = useOnboardingStore((s) => s.tutorialScreen);
  const setTutorialScreen = useOnboardingStore((s) => s.setTutorialScreen);

  const screens = getScreens(role, identity);
  const screen = screens[tutorialScreen];
  const isLast = tutorialScreen >= screens.length - 1;

  if (!screen) return null;

  return (
    <div className="animate-in fade-in duration-200">
      <div className="mb-4 flex items-center justify-between text-sm text-muted">
        <span>
          Tutorial {tutorialScreen + 1} of {screens.length}
        </span>
      </div>
      <h2 className="text-xl font-semibold text-foreground">{screen.title}</h2>
      <p className="mt-3 text-muted">{screen.body}</p>
      <div className="mt-6">{screen.visual}</div>

      <div className="mt-8 flex justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={tutorialScreen === 0}
          onClick={() => setTutorialScreen(Math.max(0, tutorialScreen - 1))}
        >
          Previous
        </Button>
        {isLast ? (
          <Button type="button" onClick={onComplete}>
            {screen.ctaLabel ?? "Finish tutorial"}
          </Button>
        ) : (
          <Button type="button" onClick={() => setTutorialScreen(tutorialScreen + 1)}>
            Next
          </Button>
        )}
      </div>

      <p className="mt-4 text-xs text-muted">
        After you finish onboarding you&apos;ll land on {resolveDashboardPath(role)}. Tutorial CTAs always complete
        onboarding first — they do not skip that step.
      </p>
    </div>
  );
}
