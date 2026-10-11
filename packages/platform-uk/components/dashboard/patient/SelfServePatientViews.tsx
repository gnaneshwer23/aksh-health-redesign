"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { HeartHandshake, Link2, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CgmPanel } from "@/components/cgm/CgmPanel";
import { MyReadings } from "@/components/patient/MyReadings";

function AshaCard() {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-white" aria-hidden>
            <MessageCircle className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">Talk to Asha</p>
            <p className="text-sm text-muted">Questions, bookings and check-ins by voice or chat. Anything urgent goes to a person.</p>
          </div>
        </div>
        <Button asChild variant="accent" className="shrink-0">
          <Link href="/asha">Open Asha</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function LinkClinicForm() {
  const { update: updateSession } = useSession();
  const [code, setCode] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-2"
      data-link-clinic
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        try {
          const r = await fetch("/api/me/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, dateOfBirth: dob }) });
          const d = await r.json().catch(() => ({}));
          if (!r.ok) return setError(d.error ?? "That code did not work. Check it, and your date of birth, with your clinic.");
          // Refresh the session's binding so patient-scoped features see the link straight away.
          await updateSession({ boundPatientId: d.patientId }).catch(() => undefined);
          window.location.reload();
        } catch {
          setError("We couldn't reach Aksh. Check your connection and try again.");
        }
      }}
    >
      <label className="text-sm"><span className="block text-xs text-muted">Invite code</span><Input className="h-10 w-48" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Clinic invite code" required /></label>
      <label className="text-sm"><span className="block text-xs text-muted">Date of birth</span><Input className="h-10" type="date" value={dob} onChange={(e) => setDob(e.target.value)} aria-label="Date of birth" required /></label>
      <Button type="submit" variant="outline" className="h-10">Link</Button>
      {error ? <p className="w-full text-sm text-red-700" role="alert">{error}</p> : null}
    </form>
  );
}

/** Self-registered patient with no clinic link: Asha and their own readings only. */
export function UnlinkedPatientView({ name }: { name?: string | null }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-card shadow-sm">
        <CardContent className="p-6">
          <h1 className="text-xl font-semibold text-primary">{name ? `Hello, ${name.split(" ")[0]}` : "Welcome"}</h1>
          <p className="mt-1 text-sm text-muted">Your account is not linked to a clinic yet.</p>
        </CardContent>
      </Card>
      <AshaCard />
      <MyReadings />
      <Card className="shadow-sm">
        <CardContent className="flex items-start gap-3 p-5">
          <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Link your clinic</p>
            <p className="mt-1 text-muted">
              Ask your clinic for an Aksh invite code. Once linked you will see your results, medicines and care team,
              and your readings reach the people who look after you.
            </p>
            <LinkClinicForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type LinkedRecord = {
  name: string;
  typeLabel: string;
  hba1c: { date: string; hba1cMmolMol: number; hba1cPercent: number }[];
  unit: "mmol/mol" | "%";
  medications: { name: string; dose: string | null }[];
  careTeam: { careRole: string; name: string }[];
  organisation: string | null;
  openCareGaps: string[];
  emergencyNumber: string | null;
};

/** Patient linked by clinic invite to a synthetic network record. */
export function LinkedNetworkPatientView() {
  const [record, setRecord] = useState<LinkedRecord | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unlinked" | "error">("loading");

  useEffect(() => {
    fetch("/api/me/record")
      .then((r) => r.json())
      .then((body: { linked?: boolean; record?: LinkedRecord }) => {
        if (body.linked && body.record) {
          setRecord(body.record);
          setState("ready");
        } else setState("unlinked");
      })
      .catch(() => setState("error"));
  }, []);

  if (state === "loading") return <p className="p-6 text-sm text-muted">Loading your record…</p>;
  if (state === "unlinked") return <UnlinkedPatientView />;
  if (state === "error" || !record) return <p className="p-6 text-sm text-muted">We could not load your record. Try again shortly.</p>;

  const latest = record.hba1c[record.hba1c.length - 1];
  const latestText = latest
    ? record.unit === "%"
      ? `${latest.hba1cPercent}%`
      : `${latest.hba1cMmolMol} mmol/mol`
    : "No result yet";

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-card shadow-sm">
        <CardContent className="p-6">
          <h1 className="text-xl font-semibold text-primary">Hello, {record.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-muted">
            {record.typeLabel}
            {record.organisation ? ` · ${record.organisation}` : ""}
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Latest HbA1c</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{latestText}</p>
            {latest ? <p className="text-xs text-muted">{latest.date}</p> : null}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Due for you</CardTitle>
          </CardHeader>
          <CardContent>
            {record.openCareGaps.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {record.openCareGaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nothing overdue.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">My medicines</CardTitle>
        </CardHeader>
        <CardContent>
          {record.medications.length ? (
            <ul className="space-y-1 text-sm">
              {record.medications.map((m) => (
                <li key={m.name}>
                  {m.name}{m.dose ? <span className="text-muted"> · {m.dose}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No regular medicines recorded.</p>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <HeartHandshake className="h-4 w-4 text-secondary" aria-hidden /> My care team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {record.careTeam.map((t) => (
              <li key={t.name + t.careRole}>
                {t.name} <span className="text-muted">· {t.careRole}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <AshaCard />
      <MyReadings fallbackEmergency={record.emergencyNumber} />
      <p className="text-center text-xs text-muted">
        <a className="underline underline-offset-2" href="/api/me/export" data-my-export>Download a copy of my data</a>
      </p>
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <CgmPanel base="/api/me/cgm" audience="patient" />
        </CardContent>
      </Card>
    </div>
  );
}
