/**
 * Milestone A4 / C4 — PHI-safe identifiers for audit / ops / logs.
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

/** Opaque ops/audit ref shape produced by phiSafeResourceRef (and Agent Ops). */
export function isOpaquePhiSafeRef(ref: string | null | undefined): boolean {
  const s = (ref ?? "").trim();
  return /^pt_[a-f0-9]{8}(?::[A-Za-z0-9_./#:-]{1,64})*$/i.test(s);
}

/**
 * Label-shaped audit refs A4 left residual on lifestyle routes / client posts:
 * e.g. "Alice Example (P001)", "Mrs Johnson", "ward / Bay 3".
 * Known opaque product ids (ReviewCase/…, lab-pharmacy-hitl:…) are allowed.
 */
export function looksLikeLabelShapedResourceRef(ref: string | null | undefined): boolean {
  const s = (ref ?? "").trim();
  if (!s) return false;
  if (isOpaquePhiSafeRef(s)) return false;
  if (
    /^(ReviewCase\/|lab-pharmacy-hitl:|hcp-eval:|research-evaluation\/|admin-audit|Observation\/|MedicationRequest\/|servicereq-)/i.test(
      s
    )
  ) {
    return false;
  }
  // "Name (id)" / "label (P001)"
  if (/\([^)]+\)/.test(s) && /\s/.test(s)) return true;
  // "id / patientName" style
  if (/\s\/\s/.test(s)) return true;
  // Multi-token person-like labels
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z.'-]+){1,3}$/.test(s)) return true;
  // Raw patient ids / free labels that are not already hashed
  if (/^P\d{2,}/i.test(s) || /^[A-Za-z][A-Za-z0-9_-]{0,47}$/.test(s)) return true;
  return true;
}

/** Prefer parenthesised id from "Label (id)"; else the whole string. */
export function extractPatientIdCandidateFromRef(ref: string): string {
  const m = ref.trim().match(/\(([^)]+)\)\s*$/);
  if (m?.[1]?.trim()) return m[1].trim();
  return ref.trim();
}

/**
 * C4 — coerce any audit resourceRef to an opaque pt_* form.
 * Prefer explicit patientId when callers still have it; otherwise extract from label-shaped input.
 */
export function normaliseAuditResourceRef(
  ref: string | null | undefined,
  options?: { patientId?: string | null; caseId?: string | null; agentLabel?: string | null }
): string {
  const raw = (ref ?? "").trim();
  if (raw && isOpaquePhiSafeRef(raw) && !looksLikeLabelShapedResourceRef(raw)) {
    return raw.slice(0, 120);
  }
  const patientId =
    options?.patientId?.trim() ||
    (raw ? extractPatientIdCandidateFromRef(raw) : "") ||
    "unknown";
  return phiSafeResourceRef(patientId, {
    caseId: options?.caseId,
    agentLabel: options?.agentLabel,
  }).slice(0, 120);
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
