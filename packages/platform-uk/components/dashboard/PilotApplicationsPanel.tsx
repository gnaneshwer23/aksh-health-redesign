"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPilotReferenceId } from "@/lib/pilot/reference-id";

type PilotApplicationRow = {
  id: string;
  orgName: string;
  orgType: string;
  region: string | null;
  contactName: string;
  contactEmail: string;
  status: string;
  createdAt: string;
  referenceLabel?: string;
};

const MOCK_APPLICATIONS: PilotApplicationRow[] = [
  {
    id: "mock-north-west-ics",
    orgName: "North West Integrated Care Board",
    orgType: "NHS ICS",
    region: "North West",
    contactName: "Dr Sarah Chen",
    contactEmail: "s.chen@example.nhs.uk",
    status: "submitted",
    createdAt: "2026-07-08T09:15:00.000Z",
    referenceLabel: "PILOT-A1B2",
  },
  {
    id: "mock-london-pcn",
    orgName: "Central London PCN",
    orgType: "GP Network / PCN",
    region: "London",
    contactName: "James Okonkwo",
    contactEmail: "j.okonkwo@example.nhs.uk",
    status: "submitted",
    createdAt: "2026-07-05T14:42:00.000Z",
    referenceLabel: "PILOT-C3D4",
  },
];

function mockFallbackEnabled() {
  return process.env.NEXT_PUBLIC_AKSH_PILOT_MOCK_FALLBACK === "true";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ApplicationsTable({ applications, limit }: { applications: PilotApplicationRow[]; limit?: number }) {
  const rows = limit ? applications.slice(0, limit) : applications;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Organisation</TableHead>
          <TableHead>Region</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((application) => (
          <TableRow key={application.id}>
            <TableCell className="font-mono text-xs">
              {application.referenceLabel ?? formatPilotReferenceId(application.id)}
            </TableCell>
            <TableCell>
              <div className="font-medium">{application.orgName}</div>
              <div className="text-xs text-muted">{application.orgType}</div>
            </TableCell>
            <TableCell>{application.region ?? "—"}</TableCell>
            <TableCell>
              <div>{application.contactName}</div>
              <div className="text-xs text-muted">{application.contactEmail}</div>
            </TableCell>
            <TableCell className="capitalize">{application.status}</TableCell>
            <TableCell>{formatDate(application.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function PilotApplicationsPanel({ compact = false, limit }: { compact?: boolean; limit?: number }) {
  const [applications, setApplications] = useState<PilotApplicationRow[]>([]);
  const [usingMock, setUsingMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      setLoading(true);
      setError(null);
      setEmpty(false);

      try {
        const response = await fetch("/api/admin/pilot-applications");
        const payload = (await response.json().catch(() => ({}))) as {
          applications?: PilotApplicationRow[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load pilot applications");
        }

        if (cancelled) return;

        if (payload.applications?.length) {
          setApplications(payload.applications);
          setUsingMock(false);
        } else if (mockFallbackEnabled()) {
          setApplications(MOCK_APPLICATIONS);
          setUsingMock(true);
        } else {
          setApplications([]);
          setUsingMock(false);
          setEmpty(true);
        }
      } catch (loadError) {
        if (cancelled) return;
        if (mockFallbackEnabled()) {
          setApplications(MOCK_APPLICATIONS);
          setUsingMock(true);
        } else {
          setApplications([]);
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load pilot applications");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadApplications();
    return () => {
      cancelled = true;
    };
  }, []);

  const content = loading ? (
    <p className="text-sm text-muted">Loading recent applications…</p>
  ) : empty ? (
    <p className="text-sm text-muted">No pilot applications submitted yet.</p>
  ) : error && !usingMock && applications.length === 0 ? (
    <p className="text-sm text-red-600">{error}</p>
  ) : (
    <ApplicationsTable applications={applications} limit={compact ? (limit ?? 3) : limit} />
  );

  if (compact) {
    return (
      <div className="px-4 pb-4">
        {usingMock ? (
          <p className="mb-2 text-xs text-amber-700">Showing sample data (mock fallback enabled).</p>
        ) : null}
        {content}
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">ICS Pilot Applications</CardTitle>
        {usingMock ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Sample data</span>
        ) : null}
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
