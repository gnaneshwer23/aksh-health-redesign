/**
 * Milestone C4 — optional ops alert channel (pager-lite / webhook).
 *
 * Default OFF. When enabled, posts PHI-free alert summaries (codes, counts,
 * opaque sampleRefs, status) for Agent Ops loop failures. Not a certified
 * pager / SOC product — thin webhook notifier only.
 *
 * Env (all required to dispatch):
 *   AKSH_OPS_ALERT_CHANNEL_ENABLED=true
 *   AKSH_OPS_ALERT_WEBHOOK_URL=https://hooks.example/…
 * Optional:
 *   AKSH_OPS_ALERT_MIN_SEVERITY=critical|warning  (default: critical)
 *   AKSH_OPS_ALERT_CHANNEL_TIMEOUT_MS=4000
 */
import { createHash } from "crypto";

import { getDeploymentEnvironment } from "@/lib/env/deployment";

import type { OpsAlertSeverity, OpsAlertSignal, OpsAlertsSummary } from "./ops-alerts";

export type OpsAlertChannelPayload = {
  source: "aksh-agent-ops";
  channel: "webhook";
  synthetic: true;
  phiLeakage: false;
  ehrWrite: false;
  certificationClaim: false;
  environment: string;
  /** Hashed scope key — never raw tenant labels. */
  scopeKeyHash: string;
  generatedAt: string;
  alertCount: number;
  alerts: Array<{
    code: OpsAlertSignal["code"];
    severity: OpsAlertSeverity;
    count: number;
    sampleRefs: string[];
    windowMinutes: number;
    threshold: number;
  }>;
  metrics: OpsAlertsSummary["metrics"];
  dualPathResidual: "file_vs_neon_ops";
  note: string;
};

export type OpsAlertChannelDispatchResult = {
  dispatched: boolean;
  reason:
    | "disabled"
    | "no_webhook"
    | "no_alerts_above_threshold"
    | "throttled"
    | "ok"
    | "http_error"
    | "network_error"
    | "phi_guard";
  status?: number;
  attemptedAt: string;
};

const SEVERITY_RANK: Record<OpsAlertSeverity, number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

/** In-process throttle so Agent Ops polling does not flood the webhook. */
const recentDispatchByFingerprint = new Map<string, number>();
const DEFAULT_THROTTLE_MS = 60 * 60 * 1000;

export function resetOpsAlertChannelThrottleForTests() {
  recentDispatchByFingerprint.clear();
}

function dispatchFingerprint(payload: OpsAlertChannelPayload): string {
  const codes = payload.alerts
    .map((a) => `${a.code}:${a.severity}:${a.count}`)
    .sort()
    .join("|");
  return createHash("sha256")
    .update(`${payload.scopeKeyHash}|${codes}`)
    .digest("hex")
    .slice(0, 16);
}

export function isOpsAlertChannelEnabled(): boolean {
  return process.env.AKSH_OPS_ALERT_CHANNEL_ENABLED?.trim() === "true";
}

export function resolveOpsAlertWebhookUrl(): string | null {
  const url = process.env.AKSH_OPS_ALERT_WEBHOOK_URL?.trim();
  return url || null;
}

export function resolveOpsAlertMinSeverity(): OpsAlertSeverity {
  const raw = (process.env.AKSH_OPS_ALERT_MIN_SEVERITY ?? "critical").trim().toLowerCase();
  if (raw === "warning" || raw === "info" || raw === "critical") return raw;
  return "critical";
}

function scopeKeyHash(scopeKey: string): string {
  return `sk_${createHash("sha256").update(scopeKey || "shared").digest("hex").slice(0, 10)}`;
}

/** Build webhook body — IDs/hashes/counts/status only (no titles/details with free text). */
export function buildOpsAlertChannelPayload(summary: OpsAlertsSummary): OpsAlertChannelPayload {
  const minSeverity = resolveOpsAlertMinSeverity();
  const minRank = SEVERITY_RANK[minSeverity];
  const alerts = summary.alerts
    .filter((a) => SEVERITY_RANK[a.severity] >= minRank)
    .map((a) => ({
      code: a.code,
      severity: a.severity,
      count: a.count,
      sampleRefs: a.sampleRefs.slice(0, 5),
      windowMinutes: a.windowMinutes,
      threshold: a.threshold,
    }));

  return {
    source: "aksh-agent-ops",
    channel: "webhook",
    synthetic: true,
    phiLeakage: false,
    ehrWrite: false,
    certificationClaim: false,
    environment: getDeploymentEnvironment(),
    scopeKeyHash: scopeKeyHash(summary.scopeKey),
    generatedAt: summary.generatedAt,
    alertCount: alerts.length,
    alerts,
    metrics: summary.metrics,
    dualPathResidual: "file_vs_neon_ops",
    note: "Optional Agent Ops alert channel. Opaque refs and counts only — no names, NHS numbers, or clinical free text. Not an external certification claim.",
  };
}

export function filterAlertsForChannel(
  summary: OpsAlertsSummary,
  minSeverity: OpsAlertSeverity = resolveOpsAlertMinSeverity()
): OpsAlertSignal[] {
  const minRank = SEVERITY_RANK[minSeverity];
  return summary.alerts.filter((a) => SEVERITY_RANK[a.severity] >= minRank);
}

/**
 * Fire-and-forget safe: never throws. Default path is a no-op when disabled.
 * Callers should not await for request latency unless testing.
 */
export async function dispatchOpsAlertChannel(
  summary: OpsAlertsSummary,
  options?: { fetchImpl?: typeof fetch }
): Promise<OpsAlertChannelDispatchResult> {
  const attemptedAt = new Date().toISOString();
  if (!isOpsAlertChannelEnabled()) {
    return { dispatched: false, reason: "disabled", attemptedAt };
  }
  const webhookUrl = resolveOpsAlertWebhookUrl();
  if (!webhookUrl) {
    return { dispatched: false, reason: "no_webhook", attemptedAt };
  }

  const payload = buildOpsAlertChannelPayload(summary);
  if (payload.alertCount === 0) {
    return { dispatched: false, reason: "no_alerts_above_threshold", attemptedAt };
  }

  for (const alert of payload.alerts) {
    for (const ref of alert.sampleRefs) {
      if (!/^pt_[a-f0-9]{8}/i.test(ref)) {
        console.error("[ops-alert-channel] refused dispatch: non-opaque sampleRef");
        return { dispatched: false, reason: "phi_guard", attemptedAt };
      }
    }
  }
  const blob = JSON.stringify(payload);
  if (/patientLabel|nhsNumber|"NHS\s/i.test(blob)) {
    console.error("[ops-alert-channel] refused dispatch: payload failed PHI guard");
    return { dispatched: false, reason: "phi_guard", attemptedAt };
  }

  const fp = dispatchFingerprint(payload);
  const throttleMs = Number(process.env.AKSH_OPS_ALERT_CHANNEL_THROTTLE_MS ?? DEFAULT_THROTTLE_MS);
  const last = recentDispatchByFingerprint.get(fp) ?? 0;
  const now = Date.now();
  if (now - last < (Number.isFinite(throttleMs) ? throttleMs : DEFAULT_THROTTLE_MS)) {
    return { dispatched: false, reason: "throttled", attemptedAt };
  }

  const timeoutMs = Number(process.env.AKSH_OPS_ALERT_CHANNEL_TIMEOUT_MS ?? "4000");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 4000);
  const fetchImpl = options?.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aksh-Ops-Alert": "1",
        "X-Aksh-Phi-Leakage": "false",
      },
      body: blob,
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error(`[ops-alert-channel] webhook HTTP ${response.status}`);
      return { dispatched: false, reason: "http_error", status: response.status, attemptedAt };
    }
    recentDispatchByFingerprint.set(fp, now);
    return { dispatched: true, reason: "ok", status: response.status, attemptedAt };
  } catch (err) {
    console.error(
      "[ops-alert-channel] webhook failed",
      err instanceof Error ? err.message : err
    );
    return { dispatched: false, reason: "network_error", attemptedAt };
  } finally {
    clearTimeout(timer);
  }
}
