import { NextResponse } from "next/server";

import { readRoadmapState, resetM1GeneratedAction, resetRoadmapState, resolveM1GeneratedAction, updateM1ChecklistItem, updateRoadmapItem } from "@/lib/roadmap-repository";
import type { M1ActionResolution, M1ChecklistItem, RoadmapTrackerItem } from "@/lib/roadmap";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const state = await readRoadmapState(scopeKey, userId);
  return NextResponse.json({ state });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const body = (await request.json().catch(() => null)) as
    | {
        action?: string;
        id?: string;
        updates?: Partial<Omit<RoadmapTrackerItem, "id">>;
        checklistUpdates?: Partial<Omit<M1ChecklistItem, "id" | "week" | "title" | "doneWhen">>;
        resolution?: Pick<M1ActionResolution, "actionId" | "itemId" | "owner" | "status" | "note"> &
          Partial<Pick<M1ActionResolution, "nextStep" | "targetDate" | "blockedReason" | "followThroughEvidenceLink">>;
        actionId?: string;
      }
    | null;

  if (body?.action === "reset") {
    const state = await resetRoadmapState(scopeKey, userId);
    return NextResponse.json({ state });
  }

  if (body?.action === "update_item" && body.id && body.updates) {
    const state = await updateRoadmapItem(body.id, body.updates, scopeKey, userId);
    return NextResponse.json({ state });
  }

  if (body?.action === "update_m1_checklist_item" && body.id && body.checklistUpdates) {
    const state = await updateM1ChecklistItem(body.id, body.checklistUpdates, scopeKey, userId);
    return NextResponse.json({ state });
  }

  if (body?.action === "resolve_m1_action" && body.resolution) {
    const state = await resolveM1GeneratedAction(body.resolution, scopeKey, userId);
    return NextResponse.json({ state });
  }

  if (body?.action === "reset_m1_action" && body.actionId) {
    const state = await resetM1GeneratedAction(body.actionId, scopeKey, userId);
    return NextResponse.json({ state });
  }

  return NextResponse.json({ error: "Unsupported roadmap action." }, { status: 400 });
}
