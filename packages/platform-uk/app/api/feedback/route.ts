import { NextResponse } from "next/server";

import {
  clearFeedbackArchive,
  readFeedbackState,
  resetFeedbackDraft,
  saveFeedbackSession,
  updateFeedbackFollowUp,
  updateFeedbackResolution,
  updateFeedbackDraft
} from "@/lib/feedback-repository";
import type { FeedbackDraft, FeedbackEntry } from "@/lib/feedback-types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const state = await readFeedbackState(scopeKey, userId);
  return NextResponse.json({ state });
}

export async function PUT(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const body = (await request.json().catch(() => null)) as { draft?: Partial<FeedbackDraft> } | null;

  if (!body?.draft) {
    return NextResponse.json({ error: "Draft payload is required." }, { status: 400 });
  }

  const state = await updateFeedbackDraft(body.draft, scopeKey, userId);
  return NextResponse.json({ state });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const body = (await request.json().catch(() => null)) as
    | {
        action?: string;
        draft?: Partial<FeedbackDraft>;
        id?: string;
        resolutionStatus?: FeedbackEntry["resolutionStatus"];
        resolutionNote?: string;
        followUp?: Partial<Pick<FeedbackEntry, "followUpOwner" | "dueDate" | "nextCheckpoint" | "overdueNote">>;
      }
    | null;

  if (body?.action === "save_session") {
    const state = await saveFeedbackSession(body.draft ?? {}, scopeKey, userId);
    return NextResponse.json({ state });
  }

  if (body?.action === "clear_archive") {
    const state = await clearFeedbackArchive(scopeKey, userId);
    return NextResponse.json({ state });
  }

  if (body?.action === "reset_draft_notes") {
    const state = await resetFeedbackDraft(scopeKey, userId);
    return NextResponse.json({ state });
  }

  if (body?.action === "update_resolution" && body.id && body.resolutionStatus) {
    const state = await updateFeedbackResolution(body.id, body.resolutionStatus, body.resolutionNote, scopeKey, userId);
    return NextResponse.json({ state });
  }

  if (body?.action === "update_follow_up" && body.id && body.followUp) {
    const state = await updateFeedbackFollowUp(body.id, body.followUp, scopeKey, userId);
    return NextResponse.json({ state });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
