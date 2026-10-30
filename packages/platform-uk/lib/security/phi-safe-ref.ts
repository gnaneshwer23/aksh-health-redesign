/**
 * Milestone A4 — PHI-safe identifiers for audit / ops / logs.
 * Never put patient names, NHS numbers, or free-text labels into resourceRef or console logs.
 */
import { createHash } from "crypto";

/** Stable opaque patient ref (matches Agent Ops `patientRefForOps`). */
export function phiSafePatientRef(patientId: string | null | undefined): string {
  const id = (patientId ?? "").trim() || "unknown";
  const digest = createHash("sha256").update(id).digest("hex").slice(0, 8);
  return `pt_${digest}`;
}

/** Audit / SHIELD resourceRef without labels or raw clinical identifiers. */
export function phiSafeResourceRef(
  patientId: string | null | undefined,
  options?: { caseId?: string | null; agentLabel?: string | null }
): string {
  const parts = [phiSafePatientRef(patientId)];
  if (options?.caseId?.trim()) {
    parts.push(`case_${options.caseId.trim().slice(0, 24)}`);
  }
  if (options?.agentLabel?.trim()) {
    parts.push(options.agentLabel.trim().slice(0, 32));
  }
  return parts.join(":");
}

/** Strip common PHI-shaped tokens from unstructured log / error strings. */
export function minimisePhiInText(text: string): string {
  return text
    .replace(/\b[A-Z]{2,4}\d{5,}[A-Z]?\b/g, "[redacted-id]")
    .replace(/\b(?:nhs|NHS)[:=\s#-]*\d[\d\s-]{5,}\b/gi, "[redacted-nhs]")
    .replace(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g, (m) => {
      // Keep short clinical codes / status words; scrub likely person names (≥2 tokens).
      if (m.split(/\s+/).length < 2) return m;
      if (/^(PASS|BLOCK|REVIEW|SYNTH|SHIELD|Guardian)/i.test(m)) return m;
      return "[redacted-name]";
    });
}
