"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  HeartPulse,
  MessageCircle,
  Pill,
  Stethoscope,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { AskAkshPanel } from "@/components/chat/AskAkshPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { PatientHeroDemoPath } from "@/components/dashboard/patient/PatientHeroDemoPath";
import { SafetyRouteCoachingGate } from "@/components/dashboard/precision-health/SafetyRouteCoachingGate";
import { ConnectorsIngestPanel } from "@/components/dashboard/precision-health/ConnectorsIngestPanel";
import { DiabetesCoachingPanel } from "@/components/dashboard/precision-health/DiabetesCoachingPanel";
import { ConsentGrantsPanel } from "@/components/dashboard/precision-health/ConsentGrantsPanel";
import { HealthPlanDraftPanel } from "@/components/dashboard/precision-health/HealthPlanDraftPanel";
import { PatientTimelinePanel } from "@/components/dashboard/precision-health/PatientTimelinePanel";
import { SpineOutcomesCapturePanel } from "@/components/dashboard/precision-health/SpineOutcomesCapturePanel";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import {
  getPatientCompanionProfile,
  getPatientGreeting,
} from "@/lib/patient-companion/profile";
import { useOnboardingStore } from "@/lib/onboarding/store";
import type { CheckInMood, MedicationAdherence } from "@/lib/patient-companion/check-in";
import { cn } from "@/lib/utils";

/** Synthetic demo patient used for Phase 1 companion API surfaces until a linked record exists. */
const COMPANION_DEMO_PATIENT_ID = "P001";
const COMPANION_DEMO_PATIENT_LABEL = "Demo patient (P001)";

/**
 * B4 (docs/PHASED_BUILD_PLAN.md) — separate synthetic diabetes-flagged demo patient for the
 * Diabetes coaching panel only. Deliberately NOT the same id as COMPANION_DEMO_PATIENT_ID (P001,
 * which is not diabetes-flagged — see lib/mock-data/patients.ts clinicalProfiles) so every other
 * companion panel above keeps reading P001 exactly as it did before B4 (Preserve B1–B3 behaviour).
 * P002 is the cohort's primary Diabetes v1 fixture (worsening HbA1c, neuropathy watch — see
 * lib/disease-modules/diabetes/fixtures.ts).
 */
const DIABETES_COACHING_DEMO_PATIENT_ID = "P002";
const DIABETES_COACHING_DEMO_PATIENT_LABEL = "Demo patient (P002)";

const TAB_VALUES = ["health", "checkins", "medications", "appointments", "ask"] as const;
type TabValue = (typeof TAB_VALUES)[number];

/** Static check-in thread demo (separate from Ask Aksh live chat). */
const CHECKIN_THREAD_DEMO = [
  { role: "ai" as const, text: "How are you feeling today?" },
  { role: "user" as const, text: "A bit more breathless than yesterday" },
  {
    role: "ai" as const,
    text: "I've noted that and shared it with your care team. A nurse will review this and may be in touch. Is there anything else?",
  },
];

const MOBILE_NAV: { value: TabValue; label: string; icon: typeof HeartPulse }[] = [
  { value: "health", label: "Health", icon: HeartPulse },
  { value: "checkins", label: "Check-ins", icon: Stethoscope },
  { value: "medications", label: "Meds", icon: Pill },
  { value: "appointments", label: "Appts", icon: CalendarDays },
  { value: "ask", label: "Ask", icon: MessageCircle },
];

export function PatientCompanion() {
  const { data: session } = useSession();
  const { profile: userProfile } = useUserProfile();
  const identity = useOnboardingStore((state) => state.identity);
  const profileIdentity = userProfile?.identity ?? identity;
  const companionProfile = useMemo(
    () =>
      getPatientCompanionProfile(
        session,
        profileIdentity,
        userProfile?.fullName,
        userProfile?.preferences
      ),
    [session, profileIdentity, userProfile?.fullName, userProfile?.preferences]
  );
  const greeting = getPatientGreeting(session, profileIdentity, userProfile?.fullName);

  /** Self-only Ask Aksh scope — fail closed until practice binds a patient id on the session. */
  const boundAskPatientId =
    typeof session?.user?.boundPatientId === "string" && session.user.boundPatientId.trim()
      ? session.user.boundPatientId.trim()
      : null;

  const [activeTab, setActiveTab] = useState<TabValue>("health");
  const [checkInStep, setCheckInStep] = useState(0);
  const [checkInMood, setCheckInMood] = useState<CheckInMood | null>(null);
  const [checkInSymptomText, setCheckInSymptomText] = useState("");
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);
  const [checkInResultNote, setCheckInResultNote] = useState<string | null>(null);
  const [medsTaken, setMedsTaken] = useState<Record<string, boolean>>({});
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash.startsWith("companion-")) return;
      setActiveTab("health");
      window.requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  const handleComingSoon = (feature: string) => {
    toast({
      title: "Coming soon",
      description: `${feature} | messages your care team securely from this app.`,
    });
  };

  const submitCheckIn = async (mood: CheckInMood, medicationAdherence: MedicationAdherence) => {
    setCheckInSubmitting(true);
    try {
      const response = await fetch(`/api/patients/${COMPANION_DEMO_PATIENT_ID}/check-in`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,
          symptomText: checkInSymptomText.trim(),
          medicationAdherence,
        }),
      });
      const data = (await response.json()) as {
        note?: string;
        error?: string;
        escalation?: { triggered?: boolean };
      };

      if (!response.ok) {
        toast({
          title: "Check-in not saved",
          description:
            data.error ??
            "Your practice hasn't linked this demo account to a patient record yet.",
        });
        setCheckInResultNote(
          data.error ?? "Check-in could not be shared with your care team this time."
        );
      } else {
        toast({
          title: data.escalation?.triggered ? "Shared — clinician review requested" : "Check-in shared",
          description: data.note ?? "Shared with your care team.",
        });
        setCheckInResultNote(data.note ?? "Thank you. Your responses have been shared with your care team.");
      }
    } catch {
      toast({ title: "Check-in failed", description: "Network error." });
      setCheckInResultNote("Check-in could not be shared with your care team this time (network error).");
    } finally {
      setCheckInSubmitting(false);
      setCheckInStep(4);
    }
  };

  const resetCheckIn = () => {
    setCheckInStep(0);
    setCheckInMood(null);
    setCheckInSymptomText("");
    setCheckInResultNote(null);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
      <PatientHeroDemoPath />
      <p
        role="status"
        data-testid="patient-honesty-banner"
        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
      >
        Practice-invited companion · synthetic demo content · clinicians keep HITL on record changes ·
        liveEmis:false — no patient-app EHR write.
      </p>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full">
        <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto rounded-xl bg-muted/40 p-1 scrollbar-none lg:grid lg:grid-cols-5 lg:overflow-visible">
          <TabsTrigger value="health" className="shrink-0 min-w-[4.75rem] text-xs sm:text-sm">
            My Health
          </TabsTrigger>
          <TabsTrigger value="checkins" className="shrink-0 min-w-[4.75rem] text-xs sm:text-sm">
            Check-ins
          </TabsTrigger>
          <TabsTrigger value="medications" className="shrink-0 min-w-[4.75rem] text-xs sm:text-sm">
            Medications
          </TabsTrigger>
          <TabsTrigger value="appointments" className="shrink-0 min-w-[4.75rem] text-xs sm:text-sm">
            Appointments
          </TabsTrigger>
          <TabsTrigger value="ask" className="shrink-0 min-w-[4.75rem] text-xs sm:text-sm">
            Ask Aksh
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-4 space-y-4">
          <div id="companion-my-health" className="scroll-mt-24 space-y-4">
            <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-card shadow-sm">
              <CardContent className="p-6">
                <h1 className="text-xl font-semibold text-primary">{greeting}</h1>
                <p className="mt-1 text-sm text-muted">Here&apos;s your health today.</p>
              </CardContent>
            </Card>
            {companionProfile.isDemoEmptyState ? (
              <p
                role="status"
                data-testid="patient-companion-demo-banner"
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
              >
                Showing <strong>demo companion content</strong> — conditions, medicines, and appointments
                below are rehearsal placeholders until your practice links a real patient record (invite-by-practice).
                Messaging and live care-team sync are not connected · liveEmis:false.
              </p>
            ) : null}
            {companionProfile.conditions.map((condition) => (
              <Card key={condition.title} className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">{condition.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted">
                  <p>
                    Status:{" "}
                    <span className="font-medium text-warning">{condition.status}</span>
                  </p>
                  <p className="mt-2">{condition.summary}</p>
                </CardContent>
              </Card>
            ))}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Your medications today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {companionProfile.medications.map((med) => {
                  const medKey = `${med.label} | ${med.schedule}`;
                  return (
                    <div key={medKey} className="flex items-center justify-between gap-2 text-sm">
                      <span>{medKey}</span>
                      <Button
                        size="sm"
                        variant={medsTaken[medKey] ? "accent" : "outline"}
                        onClick={() => setMedsTaken((t) => ({ ...t, [medKey]: !t[medKey] }))}
                      >
                        {medsTaken[medKey] ? "Taken ✓" : "Mark as Taken"}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">My Care Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {companionProfile.careTeam.map((member) => (
                  <p key={member.role}>
                    {member.role}: {member.name}
                  </p>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleComingSoon("Message Team")}
                >
                  Message Team
                </Button>
              </CardContent>
            </Card>
          </div>
          <div id="companion-diabetes-coaching" className="scroll-mt-24">
            <DiabetesCoachingPanel
              patientId={DIABETES_COACHING_DEMO_PATIENT_ID}
              patientLabel={DIABETES_COACHING_DEMO_PATIENT_LABEL}
            />
          </div>
          <div id="companion-care-plan" className="scroll-mt-24">
            <HealthPlanDraftPanel
              patientId={COMPANION_DEMO_PATIENT_ID}
              patientLabel={
                companionProfile.isDemoEmptyState
                  ? COMPANION_DEMO_PATIENT_LABEL
                  : companionProfile.displayName
              }
              mode="patient"
            />
          </div>
          <div id="companion-consent" className="scroll-mt-24">
            <ConsentGrantsPanel
              patientId={COMPANION_DEMO_PATIENT_ID}
              patientLabel={
                companionProfile.isDemoEmptyState
                  ? COMPANION_DEMO_PATIENT_LABEL
                  : companionProfile.displayName
              }
              mode="patient"
            />
          </div>
          <SpineOutcomesCapturePanel
            patientId={COMPANION_DEMO_PATIENT_ID}
            patientLabel={
              companionProfile.isDemoEmptyState
                ? COMPANION_DEMO_PATIENT_LABEL
                : companionProfile.displayName
            }
            mode="patient"
            onCaptured={() => setTimelineRefreshKey((k) => k + 1)}
          />
          <ConnectorsIngestPanel
            patientId={COMPANION_DEMO_PATIENT_ID}
            patientLabel={
              companionProfile.isDemoEmptyState
                ? COMPANION_DEMO_PATIENT_LABEL
                : companionProfile.displayName
            }
            mode="patient"
            onIngestSuccess={() => setTimelineRefreshKey((k) => k + 1)}
          />
          <PatientTimelinePanel
            patientId={COMPANION_DEMO_PATIENT_ID}
            patientLabel={
              companionProfile.isDemoEmptyState
                ? COMPANION_DEMO_PATIENT_LABEL
                : companionProfile.displayName
            }
            refreshKey={timelineRefreshKey}
          />
          <SafetyRouteCoachingGate
            patientId={COMPANION_DEMO_PATIENT_ID}
            patientLabel={
              companionProfile.isDemoEmptyState
                ? COMPANION_DEMO_PATIENT_LABEL
                : companionProfile.displayName
            }
            mode="patient"
          />
        </TabsContent>

        <TabsContent value="checkins" className="mt-4 space-y-4">
          <Card className="shadow-sm">
            <CardContent className="space-y-3 p-4">
              {CHECKIN_THREAD_DEMO.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    m.role === "ai" ? "mr-auto bg-background" : "ml-auto bg-primary text-white"
                  )}
                >
                  {m.text}
                </div>
              ))}
              <p className="text-xs text-accent">
                Shared with care team. Reviewed by {companionProfile.nurseReviewer} at 10:32
              </p>
            </CardContent>
          </Card>
          {checkInStep === 0 ? (
            <Button className="w-full" onClick={() => setCheckInStep(1)} data-testid="check-in-start">
              Start a Check-in
            </Button>
          ) : checkInStep < 4 ? (
            <Card className="space-y-3 p-4 shadow-sm">
              {checkInStep === 1 && (
                <>
                  <p className="text-sm font-medium">How are you feeling overall today?</p>
                  <div className="flex gap-2">
                    {(
                      [
                        { emoji: "😊", mood: "good" as CheckInMood },
                        { emoji: "😐", mood: "okay" as CheckInMood },
                        { emoji: "😞", mood: "struggling" as CheckInMood },
                      ]
                    ).map(({ emoji, mood }) => (
                      <Button
                        key={mood}
                        variant="outline"
                        data-testid={`check-in-mood-${mood}`}
                        onClick={() => {
                          setCheckInMood(mood);
                          setCheckInStep(2);
                        }}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </>
              )}
              {checkInStep === 2 && (
                <>
                  <p className="text-sm font-medium">Any new symptoms?</p>
                  <Input
                    placeholder="Free text"
                    value={checkInSymptomText}
                    onChange={(e) => setCheckInSymptomText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && setCheckInStep(3)}
                    data-testid="check-in-symptom-text"
                  />
                  <Button onClick={() => setCheckInStep(3)}>Next</Button>
                </>
              )}
              {checkInStep === 3 && (
                <>
                  <p className="text-sm font-medium">Did you take your medications today?</p>
                  <div className="flex gap-2">
                    {(
                      [
                        { label: "Yes", value: "yes" as MedicationAdherence },
                        { label: "No", value: "no" as MedicationAdherence },
                        { label: "Partly", value: "partly" as MedicationAdherence },
                      ]
                    ).map(({ label, value }) => (
                      <Button
                        key={value}
                        variant="outline"
                        disabled={checkInSubmitting || !checkInMood}
                        data-testid={`check-in-adherence-${value}`}
                        onClick={() => checkInMood && void submitCheckIn(checkInMood, value)}
                      >
                        {checkInSubmitting ? "Sharing…" : label}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </Card>
          ) : (
            <div className="space-y-2 text-center">
              <p className="text-sm text-accent" data-testid="check-in-result-note">
                {checkInResultNote ?? "Thank you. Your responses have been shared with your care team."}
              </p>
              <Button variant="outline" size="sm" onClick={resetCheckIn}>
                Start another check-in
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="medications" className="mt-4">
          <Card className="space-y-4 p-4 shadow-sm">
            {companionProfile.medications.map((med) => (
              <div key={med.label}>
                <p className="text-sm font-medium">{med.label}</p>
                <p className="text-xs text-muted">{med.purpose}</p>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-6 w-6 rounded-full border",
                        i < 5 ? "border-accent bg-accent" : i === 5 ? "border-danger bg-danger" : "bg-border"
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleComingSoon("Repeat prescription requests")}>
                Request Repeat Prescription
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleComingSoon("Side effect reporting")}>
                Report Side Effect
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="mt-4 space-y-4">
          <Card className="p-4 shadow-sm">
            <p className="text-sm font-medium">Upcoming</p>
            <p className="mt-2 text-sm">{companionProfile.upcomingAppointment}</p>
          </Card>
          <Card className="p-4 shadow-sm">
            <p className="text-sm font-medium">Past appointments</p>
            <p className="mt-2 text-xs text-muted">{companionProfile.pastAppointmentSummary}</p>
          </Card>
        </TabsContent>

        <TabsContent value="ask" className="mt-4 space-y-3">
          {!boundAskPatientId ? (
            <p
              role="status"
              data-testid="ask-aksh-patient-unbound"
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
            >
              Ask Aksh is self-only. Your practice hasn&apos;t linked a bound patient record on this
              session yet — once linked, chat uses <code className="text-[10px]">POST /api/chat/patient</code>{" "}
              with escalation to your care team when needed. liveEmis:false.
            </p>
          ) : null}
          <AskAkshPanel
            embedded
            audience="patient"
            patientId={boundAskPatientId}
            patientLabel={boundAskPatientId ? `Your record (${boundAskPatientId})` : null}
            className="min-h-[28rem]"
          />
        </TabsContent>
      </Tabs>

      <nav
        className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 p-2 backdrop-blur-sm lg:hidden"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto flex max-w-2xl justify-around">
          {MOBILE_NAV.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={cn(
                "flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] transition-colors",
                activeTab === value ? "text-accent" : "text-muted hover:text-foreground"
              )}
              aria-current={activeTab === value ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
