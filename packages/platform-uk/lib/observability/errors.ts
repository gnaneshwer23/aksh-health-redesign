/**
 * Error monitoring kept inside our own database: no patient data leaves the platform for an error tracker.
 * Every report is scrubbed, stored in aksh.error_events, and the first occurrence of each distinct error in an hour is
 * emailed to OPS_ALERT_EMAIL. Reporting never throws: a broken reporter must not break the request it describes.
 */
import { createHash } from "node:crypto";

import { isPostgresConfigured } from "@/lib/db/client";
import { sendEmail } from "@/lib/email/send";
import { getDeploymentEnvironment } from "@/lib/env/deployment";
import { withPrivileged } from "@/lib/network/db";

export type ErrorSource = "server" | "client" | "cron";
export type ErrorReport = { source: ErrorSource; route?: string; userId?: string; digest?: string; name?: string; message?: string; stack?: string };

const ALERT_WINDOW_MIN = 60;

/** Remove anything that could identify a person or record: emails, phone/ID numbers, dates, UUIDs, SQL key values. */
export function scrub(text: string, max: number): string {
  return text
    .replace(/Key \(([^)]*)\)=\([^)]*\)/g, "Key ($1)=([value])")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "[id]")
    .replace(/\b\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?\b/g, "[date]")
    .replace(/\+?\d[\d\s()-]{5,}\d/g, "[number]")
    .replace(/"[^"]{40,}"/g, '"[text]"')
    .replace(/\?[A-Za-z0-9_=&%.+-]+=[A-Za-z0-9_=&%.+-]*/g, "")
    .slice(0, max);
}

/** Same error, same fingerprint: numbers and ids are normalised so one fault does not look like many. */
export function fingerprint(source: ErrorSource, name: string, message: string, route?: string) {
  const norm = message.replace(/\[[a-z]+\]/g, "").replace(/\d+/g, "#").trim();
  return createHash("sha256").update(`${source}|${name}|${norm}|${route ?? ""}`).digest("hex").slice(0, 16);
}

export function normaliseError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) return { name: error.name || "Error", message: error.message || "(no message)", stack: error.stack };
  if (typeof error === "string") return { name: "Error", message: error };
  return { name: "Unknown", message: "Non-error value thrown" };
}

export async function reportError(error: unknown, ctx: Omit<ErrorReport, "name" | "message" | "stack">): Promise<void> {
  const e = normaliseError(error);
  return recordError({ ...ctx, ...e });
}

export async function recordError(report: ErrorReport): Promise<void> {
  const environment = getDeploymentEnvironment();
  const name = scrub(report.name ?? "Error", 80);
  const message = scrub(report.message ?? "(no message)", 500);
  const stack = report.stack ? scrub(report.stack, 2000) : null;
  const route = report.route ? scrub(report.route, 200) : null;
  const fp = fingerprint(report.source, name, message, route ?? undefined);
  console.error(`[error:${report.source}] ${fp} ${route ?? ""} ${name}: ${message}`);
  if (!isPostgresConfigured()) return;
  try {
    const alertTo = process.env.OPS_ALERT_EMAIL?.trim();
    const shouldAlert = await withPrivileged(async (client) => {
      const recent = alertTo
        ? (await client.query(`SELECT 1 FROM aksh.error_events WHERE fingerprint = $1 AND alerted AND occurred_at > now() - make_interval(mins => $2) LIMIT 1`, [fp, ALERT_WINDOW_MIN])).rowCount
        : 1;
      await client.query(
        `INSERT INTO aksh.error_events (environment, source, fingerprint, route, name, message, stack, digest, user_id, release, alerted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [environment, report.source, fp, route, name, message, stack, report.digest?.slice(0, 64) ?? null, report.userId?.slice(0, 64) ?? null, process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null, !recent]
      );
      return !recent;
    });
    if (shouldAlert && alertTo) {
      await sendEmail({
        to: alertTo,
        subject: `[Aksh ${environment}] ${report.source} error: ${name}`,
        text: [
          `${name}: ${message}`,
          `Source: ${report.source}${route ? ` · ${route}` : ""}`,
          `Fingerprint: ${fp} (further occurrences in the next ${ALERT_WINDOW_MIN} minutes are recorded without email)`,
          report.digest ? `Digest: ${report.digest}` : "",
          "",
          stack ?? "",
          "",
          "Recent errors: npm run errors:recent (with the environment's database).",
        ].filter((l) => l !== null).join("\n"),
      }).catch((mailError) => console.error("[error-reporter] alert email failed", mailError instanceof Error ? mailError.message : mailError));
    }
  } catch (dbError) {
    console.error("[error-reporter] could not record error", dbError instanceof Error ? dbError.message : dbError);
  }
}
