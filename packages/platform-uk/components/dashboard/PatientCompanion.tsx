"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  HeartPulse,
  MessageCircle,
  Pill,
  Stethoscope,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { CoachingDraftPanel } from "@/components/dashboard/precision-health/CoachingDraftPanel";
import { ConsentGrantsPanel } from "@/components/dashboard/precision-health/ConsentGrantsPanel";
import { PatientTimelinePanel } from "@/components/dashboard/precision-health/PatientTimelinePanel";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import {
  getPatientCompanionProfile,
  getPatientFirstName,
  getPatientGreeting,
} from "@/lib/patient-companion/profile";
import { useOnboardingStore } from "@/lib/onboarding/store";
import { cn } from "@/lib/utils";

/** Synthetic demo patient used for Phase 1 companion API surfaces until a linked record exists. */
const COMPANION_DEMO_PATIENT_ID = "P001";
const COMPANION_DEMO_PATIENT_LABEL = "Demo patient (P001)";

const TAB_VALUES = ["health", "checkins", "medications", "appointments", "ask"] as const;
type TabValue = (typeof TAB_VALUES)[number];

const MOBILE_NAV: { value: TabValue; label: string; icon: typeof HeartPulse }[] = [
  { value: "health", label: "Health", icon: HeartPulse },
  { value: "checkins", label: "Check-ins", icon: Stethoscope },
  { value: "medications", label: "Meds", icon: Pill },
  { value: "appointments", label: "Appts", icon: CalendarDays },
  { value: "ask", label: "Ask", icon: MessageCircle },
];

const MOCK_RESPONSES: Record<string, string> = {
  "What is a DVT?":
    "A DVT (deep vein thrombosis) is a blood clot in a deep vein, usually in the leg. Symptoms can include leg pain, swelling, and warmth. If you think you may have a DVT, contact your GP urgently or call 111.",
  "Are my medications safe together?":
    "Your care team reviews all your medications for safety. Some combinations need extra monitoring. Always tell your GP and pharmacist about everything you take, including over-the-counter medicines.",
  "When should I call 999?":
    "Call 999 immediately for chest pain, severe breathlessness, signs of stroke (face drooping, arm weakness, speech difficulty), or if you feel your life is at risk.",
};

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
  const firstName = getPatientFirstName(session, profileIdentity, userProfile?.fullName);
  const greeting = getPatientGreeting(session, profileIdentity, userProfile?.fullName);

  const [activeTab, setActiveTab] = useState<TabValue>("health");
  const [checkInStep, setCheckInStep] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "ai" | "user"; text: string }[]>(() => [
    { role: "ai", text: `How are you feeling today, ${firstName}?` },
    { role: "user", text: "A bit more breathless than yesterday" },
    {
      role: "ai",
      text: `I've noted that and shared it with your care team. A nurse will review this and may be in touch. Is there anything else?`,
    },
  ]);
  const [medsTaken, setMedsTaken] = useState<Record<string, boolean>>({});

  const handleComingSoon = (feature: string) => {
    toast({
      title: "Coming soon",
      description: `${feature} | messages your care team securely from this app.`,
    });
  };

  const handleChat = (text: string) => {
    setChatMessages((m) => [
      ...m,
      { role: "user", text },
      {
        role: "ai",
        text:
          MOCK_RESPONSES[text] ??
          "Thank you for your question. Please speak to your GP about your personal health concerns.",
      },
    ]);
    setChatInput("");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
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
              below are rehearsal placeholders until your practice links a real patient record. Messaging
              and live care-team sync are not connected in this build.
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
          <ConsentGrantsPanel
            patientId={COMPANION_DEMO_PATIENT_ID}
            patientLabel={
              companionProfile.isDemoEmptyState
                ? COMPANION_DEMO_PATIENT_LABEL
                : companionProfile.displayName
            }
            mode="patient"
          />
          <PatientTimelinePanel
            patientId={COMPANION_DEMO_PATIENT_ID}
            patientLabel={
              companionProfile.isDemoEmptyState
                ? COMPANION_DEMO_PATIENT_LABEL
                : companionProfile.displayName
            }
          />
          <CoachingDraftPanel
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
              {chatMessages.map((m, i) => (
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
            <Button className="w-full" onClick={() => setCheckInStep(1)}>
              Start a Check-in
            </Button>
          ) : checkInStep < 4 ? (
            <Card className="space-y-3 p-4 shadow-sm">
              {checkInStep === 1 && (
                <>
                  <p className="text-sm font-medium">How are you feeling overall today?</p>
                  <div className="flex gap-2">
                    {["😊", "😐", "😞"].map((e) => (
                      <Button key={e} variant="outline" onClick={() => setCheckInStep(2)}>
                        {e}
                      </Button>
                    ))}
                  </div>
                </>
              )}
              {checkInStep === 2 && (
                <>
                  <p className="text-sm font-medium">Any new symptoms?</p>
                  <Input placeholder="Free text" onKeyDown={(e) => e.key === "Enter" && setCheckInStep(3)} />
                  <Button onClick={() => setCheckInStep(3)}>Next</Button>
                </>
              )}
              {checkInStep === 3 && (
                <>
                  <p className="text-sm font-medium">Did you take your medications today?</p>
                  <div className="flex gap-2">
                    {["Yes", "No", "Partly"].map((o) => (
                      <Button key={o} variant="outline" onClick={() => setCheckInStep(4)}>
                        {o}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </Card>
          ) : (
            <p className="text-center text-sm text-accent">
              Thank you. Your responses have been shared with your care team.
            </p>
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

        <TabsContent value="ask" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.keys(MOCK_RESPONSES).map((q) => (
              <Button key={q} variant="outline" size="sm" onClick={() => handleChat(q)}>
                {q}
              </Button>
            ))}
          </div>
          <Card className="min-h-[200px] space-y-2 p-4 shadow-sm">
            {chatMessages
              .filter((_, i) => i >= chatMessages.length - 4)
              .map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    m.role === "ai" ? "bg-accent/10" : "ml-8 bg-primary/10"
                  )}
                >
                  {m.text}
                </div>
              ))}
          </Card>
          <div className="flex gap-2">
            <Input
              placeholder="Type a health question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && chatInput && handleChat(chatInput)}
            />
            <Button onClick={() => chatInput && handleChat(chatInput)}>Send</Button>
          </div>
          <p className="text-[10px] text-muted">
            This AI assistant provides health information, not medical advice. Always speak to your GP about your
            personal health.
          </p>
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
