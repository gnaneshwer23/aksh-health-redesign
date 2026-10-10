"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, HeartHandshake, Link2, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Reading = { at: string; kind: "glucose" | "bp" | "weight"; value: string };

const READINGS_KEY = "aksh_self_readings_v1";
const KIND_LABEL: Record<Reading["kind"], string> = {
  glucose: "Glucose (mmol/L)",
  bp: "Blood pressure",
  weight: "Weight (kg)",
};

function loadReadings(): Reading[] {
  try {
    const raw = window.localStorage.getItem(READINGS_KEY);
    return raw ? (JSON.parse(raw) as Reading[]) : [];
  } catch {
    return [];
  }
}

function saveReadings(readings: Reading[]) {
  try {
    window.localStorage.setItem(READINGS_KEY, JSON.stringify(readings.slice(0, 50)));
  } catch {
    // Storage unavailable (private mode): the reading still shows for this visit.
  }
}

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

function ReadingsCard({ note }: { note: string }) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [kind, setKind] = useState<Reading["kind"]>("glucose");
  const [value, setValue] = useState("");

  useEffect(() => setReadings(loadReadings()), []);

  function add() {
    const v = value.trim();
    if (!v) return;
    const next = [{ at: new Date().toISOString(), kind, value: v }, ...readings];
    setReadings(next);
    saveReadings(next);
    setValue("");
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-secondary" aria-hidden /> My readings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <label className="sr-only" htmlFor="reading-kind">
            Reading type
          </label>
          <select
            id="reading-kind"
            className="h-10 rounded-md border border-border-subtle bg-white px-3 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as Reading["kind"])}
          >
            {(Object.keys(KIND_LABEL) as Reading["kind"][]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <Input
            aria-label="Reading value"
            className="h-10 w-36"
            placeholder={kind === "bp" ? "e.g. 128/82" : "Value"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button type="submit" variant="outline" className="h-10">
            Add
          </Button>
        </form>
        {readings.length ? (
          <ul className="divide-y divide-border-subtle text-sm" aria-label="Recent readings">
            {readings.slice(0, 8).map((r) => (
              <li key={r.at} className="flex justify-between py-1.5">
                <span>
                  {KIND_LABEL[r.kind]}: <strong>{r.value}</strong>
                </span>
                <span className="text-muted">{new Date(r.at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No readings yet.</p>
        )}
        <p className="text-xs text-muted">{note}</p>
      </CardContent>
    </Card>
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
      <ReadingsCard note="Saved on this device only. Nothing is shared with a clinician until your clinic links your account." />
      <Card className="shadow-sm">
        <CardContent className="flex items-start gap-3 p-5">
          <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Link your clinic</p>
            <p className="mt-1 text-muted">
              Ask your clinic for an Aksh invite code. Once linked you will see your results, medicines and care team,
              and your readings reach the people who look after you.
            </p>
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
      <ReadingsCard
        note={`Saved on this device for now; sharing readings with your care team arrives with the patient app.${record.emergencyNumber ? ` In an emergency call ${record.emergencyNumber}.` : " In an emergency call your local emergency number."}`}
      />
    </div>
  );
}
