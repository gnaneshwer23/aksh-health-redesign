"use client";

import { useCallback, useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PayerVbcMetrics, PharmaRweSummary } from "@/lib/precision-health/pharma-payer";

/**
 * Admin read-only stubs — explicitly not live payer/pharma integrations.
 */
export function PharmaPayerStubPanel() {
  const [rwe, setRwe] = useState<PharmaRweSummary | null>(null);
  const [vbc, setVbc] = useState<PayerVbcMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [rweRes, vbcRes] = await Promise.all([
        fetch("/api/integrations/pharma-rwe", { credentials: "include" }),
        fetch("/api/integrations/payer-vbc", { credentials: "include" }),
      ]);
      if (!rweRes.ok || !vbcRes.ok) {
        setError("Could not load pharma/payer stubs (auth required).");
        return;
      }
      setRwe((await rweRes.json()) as PharmaRweSummary);
      setVbc((await vbcRes.json()) as PayerVbcMetrics);
    } catch {
      setError("Network error loading pharma/payer stubs.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card className="shadow-sm" data-testid="pharma-payer-stub-panel">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">Pharma / payer stubs (read-only)</CardTitle>
        <p className="text-xs text-muted">
          Not a live payer/pharma integration — synthetic regional aggregate placeholders only
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        {error ? <p className="text-xs text-danger">{error}</p> : null}

        <div>
          <p className="text-xs font-semibold">RWE summary placeholder</p>
          {rwe ? (
            <ul className="mt-1 space-y-1 text-xs text-muted">
              <li>livePharmaIntegration: {String(rwe.livePharmaIntegration)}</li>
              {rwe.endpoints.map((e) => (
                <li key={e.id}>
                  {e.label}: {e.valueText}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted">Loading…</p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold">Value-based care metrics (synthetic)</p>
          {vbc ? (
            <ul className="mt-1 space-y-1 text-xs text-muted">
              <li>livePayerIntegration: {String(vbc.livePayerIntegration)}</li>
              {vbc.metrics.map((m) => (
                <li key={m.id}>
                  {m.label}: {m.valueText}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted">Loading…</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
