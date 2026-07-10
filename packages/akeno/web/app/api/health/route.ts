import { getSql } from "@/lib/db";

export async function GET() {
  try {
    const sql = getSql();
    await sql`SELECT 1 AS ok`;
    return Response.json({ status: "ok", service: "akenohealth-web", database: "connected" });
  } catch (error) {
    return Response.json(
      { status: "error", service: "akenohealth-web", database: "disconnected", detail: String(error) },
      { status: 500 },
    );
  }
}
