/**
 * Honest email delivery posture — never fake delivery.
 * Resend sandbox (`onboarding@resend.dev`) only delivers to the Resend account owner inbox.
 */

export type EmailDeliveryMode = "verified_domain" | "resend_sandbox" | "unconfigured";

export function getEmailDeliveryMode(): EmailDeliveryMode {
  const from = (
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    ""
  ).toLowerCase();

  const hasProvider = Boolean(
    process.env.RESEND_API_KEY?.trim() ||
      (process.env.SMTP_HOST?.trim() &&
        process.env.SMTP_PORT?.trim() &&
        process.env.SMTP_USER?.trim() &&
        process.env.SMTP_PASS?.trim())
  );

  if (!hasProvider) return "unconfigured";
  if (from.includes("@resend.dev")) return "resend_sandbox";
  return "verified_domain";
}

export function isResendSandboxMode(): boolean {
  return getEmailDeliveryMode() === "resend_sandbox";
}

/** Short operator-facing note for dashboards and auth flows. */
export function getEmailDeliveryNotice(): string | null {
  switch (getEmailDeliveryMode()) {
    case "resend_sandbox":
      return "Transactional email is in Resend sandbox mode (onboarding@resend.dev). Verification and password-reset emails only reach the Resend account owner until akshhealth.com is verified at resend.com/domains.";
    case "unconfigured":
      return "Transactional email is not configured. Password reset and verification links are not sent in this environment.";
    default:
      return null;
  }
}

/** User-facing copy for signup / verify flows (no internal provider names). */
export function getEmailDeliveryUserHint(): string | null {
  switch (getEmailDeliveryMode()) {
    case "resend_sandbox":
      return "Email delivery is limited during demo launch. If you do not receive a message, sign in with your demo credentials or contact the Aksh Health team.";
    case "unconfigured":
      return "Email is not configured in this environment. Your account is still created — sign in to continue.";
    default:
      return null;
  }
}

/** Client-safe hint — reads NEXT_PUBLIC_EMAIL_DELIVERY_MODE when set, else null. */
export function getEmailDeliveryUserHintClient(): string | null {
  const mode = process.env.NEXT_PUBLIC_EMAIL_DELIVERY_MODE?.trim() as EmailDeliveryMode | undefined;
  if (mode === "resend_sandbox") {
    return "Email delivery is limited during demo launch. If you do not receive a message, sign in with your demo credentials or contact the Aksh Health team.";
  }
  if (mode === "unconfigured") {
    return "Email is not configured in this environment. Your account is still created — sign in to continue.";
  }
  return null;
}

export function isResendSandboxModeClient(): boolean {
  return process.env.NEXT_PUBLIC_EMAIL_DELIVERY_MODE?.trim() === "resend_sandbox";
}
