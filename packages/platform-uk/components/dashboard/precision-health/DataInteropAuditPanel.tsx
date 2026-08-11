"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * D6 (docs/PHASED_BUILD_PLAN_D.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P2-4): Data & Interoperability
 * audit view — admin-only, read-only. Answers "is anything live anywhere"
 * by reading C4's formalized adapter registry (`buildIntegrationAdapterRegistry()`
 * / `hasAnyLiveIntegrationAdapter()`, lib/data-interop/adapter-contract.ts)
 * via the existing GET /api/system/integration-contract endpoint (C4) — no
 * new registry, no new endpoint, no change to any adapter's actual
 * mode/behaviour. This panel only renders what that contract already
 * reports.
 */

type FormalizedAdapter = {
  systemId: string;
  resourceType: string;
  mode: "staged" | "live";
  consentScopeRequired: boolean;
  provenanceTag: string;
};

type IntegrationContractResponse = {
  formalizedAdapters?: FormalizedAdapter[];
  generatedAt?: string;
  error?: string;
};

export function DataInteropAuditPanel() {
  const [adapters, setAdapters] = useState<FormalizedAdapter[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/system/integration-contract", {
        credentials: "include",
        cache: "no-store"
      });
      const data = (await response.json()) as IntegrationContractResponse;
      if (!response.ok) {
        setError(data.error ?? "Could not load the integration boundary contract.");
        return;
      }
      setAdapters(data.formalizedAdapters ?? []);
      setGeneratedAt(data.generatedAt ?? null);
    } catch {
      setError("Network error loading the integration boundary contract.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Mirrors hasAnyLiveIntegrationAdapter() exactly — computed here from the
  // same formalizedAdapters array that function itself reads, rather than
  // adding a second endpoint field for one boolean.
  const anyLive = adapters.some((adapter) => adapter.mode === "live");

  return (
    <Card className="shadow-sm" data-testid="data-interop-audit-panel">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div>
          <CardTitle className="text-sm">Data &amp; Interoperability audit</CardTitle>
          <p className="text-xs text-muted">
            Every formalized adapter (Domain 6) — read-only, admin-only. Reads C4&apos;s existing integration
            boundary contract verbatim; changes nothing.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("mr-1 h-3 w-3", loading && "animate-spin")} /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-xs font-semibold",
            anyLive
              ? "border-danger/40 bg-danger/10 text-danger"
              : "border-accent/40 bg-accent/10 text-accent"
          )}
          data-testid="data-interop-live-banner"
        >
          {loading
            ? "Checking live-adapter status…"
            : anyLive
              ? "⚠ At least one adapter reports mode: live"
              : `✓ No live adapters — all ${adapters.length} formalized adapter${adapters.length === 1 ? "" : "s"} are staged`}
        </div>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        {!loading && adapters.length === 0 && !error ? (
          <p
            role="status"
            data-testid="data-interop-audit-empty"
            className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted"
          >
            No formalized adapters returned by the integration boundary contract.
          </p>
        ) : null}
        {adapters.length > 0 ? (
          <Table data-testid="data-interop-audit-table">
            <TableHeader>
              <TableRow>
                <TableHead className="h-9 px-2 text-xs">System ID</TableHead>
                <TableHead className="h-9 px-2 text-xs">Resource type</TableHead>
                <TableHead className="h-9 px-2 text-xs">Mode</TableHead>
                <TableHead className="h-9 px-2 text-xs">Consent scope required</TableHead>
                <TableHead className="h-9 px-2 text-xs">Provenance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adapters.map((adapter) => (
                <TableRow key={adapter.systemId} data-testid="data-interop-audit-row">
                  <TableCell className="p-2 text-xs font-medium">{adapter.systemId}</TableCell>
                  <TableCell className="p-2 text-xs text-muted">{adapter.resourceType}</TableCell>
                  <TableCell className="p-2 text-xs">
                    <span
                      className={cn(
                        "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        adapter.mode === "live" ? "bg-danger/10 text-danger" : "bg-muted/30 text-muted"
                      )}
                    >
                      {adapter.mode}
                    </span>
                  </TableCell>
                  <TableCell className="p-2 text-xs text-muted">{adapter.consentScopeRequired ? "Yes" : "No"}</TableCell>
                  <TableCell className="p-2 text-xs text-muted">{adapter.provenanceTag}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
        {generatedAt ? (
          <p className="text-[10px] text-muted" data-testid="data-interop-audit-generated-at">
            Contract generated {new Date(generatedAt).toLocaleString("en-GB")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
