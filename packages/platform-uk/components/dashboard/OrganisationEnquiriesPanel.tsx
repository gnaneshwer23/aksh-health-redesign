"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAccessRequestReferenceId } from "@/lib/access-requests/reference-id";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { matchesOrgEmail } from "@/lib/profile/personalization";

type OrganisationEnquiryRow = {
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

const MOCK_ENQUIRIES: OrganisationEnquiryRow[] = [
  {
    id: "mock-north-west-ics",
    orgName: "North West Integrated Care Board",
    orgType: "NHS ICS",
    region: "North West",
    contactName: "Dr Sarah Chen",
    contactEmail: "s.chen@example.nhs.uk",
    status: "submitted",
    createdAt: "2026-07-08T09:15:00.000Z",
    referenceLabel: "AKSH-A1B2",
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
    referenceLabel: "AKSH-C3D4",
  },
];

function mockFallbackEnabled() {
  return (
    process.env.NEXT_PUBLIC_AKSH_ACCESS_REQUEST_MOCK_FALLBACK === "true" ||
    process.env.NEXT_PUBLIC_AKSH_PILOT_MOCK_FALLBACK === "true"
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function EnquiriesTable({
  enquiries,
  limit,
  highlightOrg,
}: {
  enquiries: OrganisationEnquiryRow[];
  limit?: number;
  highlightOrg?: string | null;
}) {
  const rows = limit ? enquiries.slice(0, limit) : enquiries;

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
        {rows.map((enquiry) => {
          const isHighlighted =
            Boolean(highlightOrg) &&
            (enquiry.orgName.toLowerCase().includes(highlightOrg!.toLowerCase()) ||
              matchesOrgEmail(enquiry.contactEmail, highlightOrg));

          return (
            <TableRow key={enquiry.id} className={isHighlighted ? "bg-primary/5" : undefined}>
            <TableCell className="font-mono text-xs">
              {enquiry.referenceLabel ?? formatAccessRequestReferenceId(enquiry.id)}
            </TableCell>
            <TableCell>
              <div className="font-medium">{enquiry.orgName}</div>
              <div className="text-xs text-muted">{enquiry.orgType}</div>
            </TableCell>
            <TableCell>{enquiry.region ?? "Not set"}</TableCell>
            <TableCell>
              <div>{enquiry.contactName}</div>
              <div className="text-xs text-muted">{enquiry.contactEmail}</div>
            </TableCell>
            <TableCell className="capitalize">{enquiry.status}</TableCell>
            <TableCell>{formatDate(enquiry.createdAt)}</TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function OrganisationEnquiriesPanel({
  compact = false,
  limit,
  highlightOrg,
}: {
  compact?: boolean;
  limit?: number;
  highlightOrg?: string | null;
}) {
  const { profile } = useUserProfile();
  const resolvedHighlightOrg = highlightOrg ?? profile?.organisation ?? null;
  const [enquiries, setEnquiries] = useState<OrganisationEnquiryRow[]>([]);
  const [usingMock, setUsingMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEnquiries() {
      setLoading(true);
      setError(null);
      setEmpty(false);

      try {
        const response = await fetch("/api/admin/access-requests");
        const payload = (await response.json().catch(() => ({}))) as {
          applications?: OrganisationEnquiryRow[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load organisation enquiries");
        }

        if (cancelled) return;

        if (payload.applications?.length) {
          setEnquiries(payload.applications);
          setUsingMock(false);
        } else if (mockFallbackEnabled()) {
          setEnquiries(MOCK_ENQUIRIES);
          setUsingMock(true);
        } else {
          setEnquiries([]);
          setUsingMock(false);
          setEmpty(true);
        }
      } catch (loadError) {
        if (cancelled) return;
        if (mockFallbackEnabled()) {
          setEnquiries(MOCK_ENQUIRIES);
          setUsingMock(true);
        } else {
          setEnquiries([]);
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load organisation enquiries");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadEnquiries();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedEnquiries = [...enquiries].sort((a, b) => {
    if (!resolvedHighlightOrg) return 0;
    const aMatch =
      a.orgName.toLowerCase().includes(resolvedHighlightOrg.toLowerCase()) ||
      matchesOrgEmail(a.contactEmail, resolvedHighlightOrg);
    const bMatch =
      b.orgName.toLowerCase().includes(resolvedHighlightOrg.toLowerCase()) ||
      matchesOrgEmail(b.contactEmail, resolvedHighlightOrg);
    return Number(bMatch) - Number(aMatch);
  });

  const content = loading ? (
    <p className="text-sm text-muted">Loading recent enquiries…</p>
  ) : empty ? (
    <p className="text-sm text-muted">No organisation enquiries submitted yet.</p>
  ) : error && !usingMock && enquiries.length === 0 ? (
    <p className="text-sm text-red-600">{error}</p>
  ) : (
    <EnquiriesTable
      enquiries={sortedEnquiries}
      limit={compact ? (limit ?? 3) : limit}
      highlightOrg={resolvedHighlightOrg}
    />
  );

  if (compact) {
    return (
      <div className="px-4 pb-4">
        {usingMock ? (
          <p className="mb-2 text-xs text-amber-700">Showing sample data (mock fallback enabled).</p>
        ) : null}
        {resolvedHighlightOrg ? (
          <p className="mb-2 text-xs text-primary">Matching enquiries for {resolvedHighlightOrg} are highlighted.</p>
        ) : null}
        {content}
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Organisation Enquiries</CardTitle>
        {usingMock ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Sample data</span>
        ) : null}
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
