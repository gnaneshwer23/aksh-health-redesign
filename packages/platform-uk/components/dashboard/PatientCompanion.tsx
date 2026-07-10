"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MOCK_RESPONSES: Record<string, string> = {
  "What is a DVT?":
    "A DVT (deep vein thrombosis) is a blood clot in a deep vein, usually in the leg. Symptoms can include leg pain, swelling, and warmth. If you think you may have a DVT, contact your GP urgently or call 111.",
  "Are my medications safe together?":
    "Your care team reviews all your medications for safety. Some combinations need extra monitoring. Always tell your GP and pharmacist about everything you take, including over-the-counter medicines.",
  "When should I call 999?":
    "Call 999 immediately for chest pain, severe breathlessness, signs of stroke (face drooping, arm weakness, speech difficulty), or if you feel your life is at risk.",
};

export function PatientCompanion() {
  const [checkInStep, setCheckInStep] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "ai" | "user"; text: string }[]>([
    { role: "ai", text: "How are you feeling today, James?" },
    { role: "user", text: "A bit more breathless than yesterday" },
    { role: "ai", text: "I've noted that and shared it with your care team. A nurse will review this and may be in touch. Is there anything else?" },
  ]);
  const [medsTaken, setMedsTaken] = useState<Record<string, boolean>>({});

  const handleChat = (text: string) => {
    setChatMessages((m) => [...m, { role: "user", text }, { role: "ai", text: MOCK_RESPONSES[text] ?? "Thank you for your question. Please speak to your GP about your personal health concerns." }]);
    setChatInput("");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
      <Tabs defaultValue="health" className="w-full">
        <TabsList className="w-full grid grid-cols-5 lg:inline-flex">
          <TabsTrigger value="health">My Health</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="ask">Ask Aksh</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4 mt-4">
          <Card className="shadow-sm border-accent/20 bg-gradient-to-br from-accent/5 to-card">
            <CardContent className="p-6">
              <h1 className="text-xl font-semibold text-primary">Good morning, James.</h1>
              <p className="text-sm text-muted mt-1">Here&apos;s your health today.</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Type 2 Diabetes</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted">
              <p>Status: <span className="text-warning font-medium">Monitor</span></p>
              <p className="mt-2">Your HbA1c review is due. Your GP is reviewing your medications following your recent DVT diagnosis.</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Your medications today</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {["Metformin 500mg — twice daily", "Aspirin 75mg — once daily"].map((m) => (
                <div key={m} className="flex items-center justify-between text-sm">
                  <span>{m}</span>
                  <Button size="sm" variant={medsTaken[m] ? "accent" : "outline"} onClick={() => setMedsTaken((t) => ({ ...t, [m]: !t[m] }))}>
                    {medsTaken[m] ? "Taken ✓" : "Mark as Taken"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">My Care Team</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>GP: Dr Morgan</p>
              <p>Nurse: Nurse Davies</p>
              <p>Pharmacist: Pharmacist Lee</p>
              <Button variant="outline" size="sm" className="mt-2">Message Team</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkins" className="mt-4 space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-3">
              {chatMessages.map((m, i) => (
                <div key={i} className={cn("max-w-[85%] rounded-lg px-3 py-2 text-sm", m.role === "ai" ? "bg-background mr-auto" : "bg-primary text-white ml-auto")}>
                  {m.text}
                </div>
              ))}
              <p className="text-xs text-accent">Shared with care team — reviewed by Nurse Davies at 10:32</p>
            </CardContent>
          </Card>
          {checkInStep === 0 ? (
            <Button className="w-full" onClick={() => setCheckInStep(1)}>Start a Check-in</Button>
          ) : checkInStep < 4 ? (
            <Card className="shadow-sm p-4 space-y-3">
              {checkInStep === 1 && (
                <>
                  <p className="text-sm font-medium">How are you feeling overall today?</p>
                  <div className="flex gap-2">{["😊", "😐", "😞"].map((e) => <Button key={e} variant="outline" onClick={() => setCheckInStep(2)}>{e}</Button>)}</div>
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
                  <div className="flex gap-2">{["Yes", "No", "Partly"].map((o) => <Button key={o} variant="outline" onClick={() => setCheckInStep(4)}>{o}</Button>)}</div>
                </>
              )}
            </Card>
          ) : (
            <p className="text-sm text-accent text-center">Thank you. Your responses have been shared with your care team.</p>
          )}
        </TabsContent>

        <TabsContent value="medications" className="mt-4">
          <Card className="shadow-sm p-4 space-y-4">
            {["Metformin 500mg", "Aspirin 75mg"].map((med) => (
              <div key={med}>
                <p className="font-medium text-sm">{med}</p>
                <p className="text-xs text-muted">For diabetes / heart health</p>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <span key={i} className={cn("h-6 w-6 rounded-full border", i < 5 ? "bg-accent border-accent" : i === 5 ? "bg-danger border-danger" : "bg-border")} />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Request Repeat Prescription</Button>
              <Button variant="outline" size="sm">Report Side Effect</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="mt-4 space-y-4">
          <Card className="shadow-sm p-4">
            <p className="text-sm font-medium">Upcoming</p>
            <p className="text-sm mt-2">24 Jul 2026, 09:30 — GP review (Riverside Medical Centre)</p>
          </Card>
          <Card className="shadow-sm p-4">
            <p className="text-sm font-medium">Past appointments</p>
            <p className="text-xs text-muted mt-2">Your last GP appointment summary: Dr Morgan reviewed your diabetes medications and suspected a blood clot in your leg. You were referred for a scan.</p>
          </Card>
        </TabsContent>

        <TabsContent value="ask" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.keys(MOCK_RESPONSES).map((q) => (
              <Button key={q} variant="outline" size="sm" onClick={() => handleChat(q)}>{q}</Button>
            ))}
          </div>
          <Card className="shadow-sm p-4 min-h-[200px] space-y-2">
            {chatMessages.filter((_, i) => i >= chatMessages.length - 4).map((m, i) => (
              <div key={i} className={cn("text-sm rounded-lg px-3 py-2", m.role === "ai" ? "bg-accent/10" : "bg-primary/10 ml-8")}>{m.text}</div>
            ))}
          </Card>
          <div className="flex gap-2">
            <Input placeholder="Type a health question..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && chatInput && handleChat(chatInput)} />
            <Button onClick={() => chatInput && handleChat(chatInput)}>Send</Button>
          </div>
          <p className="text-[10px] text-muted">This AI assistant provides health information, not medical advice. Always speak to your GP about your personal health.</p>
        </TabsContent>
      </Tabs>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-2 lg:hidden" aria-label="Mobile navigation">
        <div className="flex justify-around text-[10px] text-muted">
          {["Health", "Check-ins", "Meds", "Appts", "Ask"].map((l) => <span key={l}>{l}</span>)}
        </div>
      </nav>
    </div>
  );
}
