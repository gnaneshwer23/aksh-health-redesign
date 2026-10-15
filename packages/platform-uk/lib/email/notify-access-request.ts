import type { AccessRequestRecord } from "@/lib/access-requests/access-request-repository";
import { formatAccessRequestReferenceId } from "@/lib/access-requests/reference-id";
import { sendEmail } from "@/lib/email/send";

export async function notifyAccessRequestSubmitted(record: AccessRequestRecord) {
  // A dedicated inbox if configured, else the ops alert inbox, so no enquiry goes unseen.
  const notifyEmail = process.env.ACCESS_REQUEST_NOTIFY_EMAIL?.trim() || process.env.OPS_ALERT_EMAIL?.trim();
  if (!notifyEmail) {
    console.warn(
      "[access-request] Neither ACCESS_REQUEST_NOTIFY_EMAIL nor OPS_ALERT_EMAIL is set. Enquiry saved but no notification sent."
    );
    return { sent: false, provider: "none" as const };
  }

  const reference = formatAccessRequestReferenceId(record.id);

  return sendEmail({
    to: notifyEmail,
    subject: `New organisation enquiry: ${record.orgName} (${reference})`,
    text: [
      "A new organisation enquiry was submitted on Aksh Health.",
      "",
      `Reference: ${reference}`,
      `Organisation: ${record.orgName}`,
      `Type: ${record.orgType}`,
      `Region: ${record.region ?? "Not specified"}`,
      `organisation ID: ${record.odsCode ?? "Not specified"}`,
      `Contact: ${record.contactName} <${record.contactEmail}>`,
      `EHR systems: ${record.ehrSystems.join(", ") || "Not specified"}`,
      `List size: ${record.listSize ?? "Not specified"}`,
      `IT contact: ${record.itContact ?? "Not specified"}`,
      `Commitments: ${record.commitments.join("; ") || "None"}`,
      "",
      `Submitted at: ${record.createdAt}`,
    ].join("\n"),
  });
}
