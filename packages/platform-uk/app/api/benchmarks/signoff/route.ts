import { NextResponse } from "next/server";

import {
  readBenchmarkSignoffState,
  updateBenchmarkSignoffDraft
} from "@/lib/benchmark-signoff-repository";
import { saveBenchmarkSignoffWithReadinessSnapshot } from "@/lib/benchmark-signoff-workflow";
import type { BenchmarkSignoffDraft } from "@/lib/benchmark-signoff-types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const state = await readBenchmarkSignoffState(scopeKey, userId);
  return NextResponse.json({ state });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const body = (await request.json().catch(() => null)) as
    | {
        action?: "update_draft" | "save_signoff";
        draft?: Partial<BenchmarkSignoffDraft>;
      }
    | null;

  if (body?.action === "update_draft") {
    const state = await updateBenchmarkSignoffDraft(body.draft ?? {}, scopeKey, userId);
    return NextResponse.json({ state });
  }

  if (body?.action === "save_signoff") {
    const state = await saveBenchmarkSignoffWithReadinessSnapshot(body.draft ?? {}, scopeKey, userId);
    return NextResponse.json({ state });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
