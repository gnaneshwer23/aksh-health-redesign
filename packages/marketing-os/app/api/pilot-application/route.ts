import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  console.log("[pilot-application]", JSON.stringify(body, null, 2));
  return NextResponse.json({ success: true, message: "Application received" });
}
