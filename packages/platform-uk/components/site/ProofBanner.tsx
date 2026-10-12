/** Shown on every page of the clinical-proof environment (lib/env/proof.ts). Not dismissible. */
export function ProofBanner() {
  return (
    <div
      role="note"
      data-proof-banner
      style={{ position: "sticky", top: 0, zIndex: 60, background: "#1f2a24", color: "#f3efe4", fontSize: 13, lineHeight: 1.4, padding: "8px 16px", textAlign: "center" }}
    >
      <strong>Clinical-proof environment.</strong> Every patient, clinic and result here is synthetic. Do not enter real patient
      details. This is not the Aksh Health product at akshhealth.com.
    </div>
  );
}
