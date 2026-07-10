"use client";

import { useState } from "react";

import { AgentBadge, QueueStatusBadge } from "@/components/review/agent-badge";
import type { ReviewQueueItem, ReviewQueueItemType } from "@/lib/types";

export function GpReviewQueuePanel({
  items,
  agentFilter,
  reviewerName,
  onAccept,
  onReject,
  onEdit
}: {
  items: ReviewQueueItem[];
  agentFilter: ReviewQueueItemType | null;
  reviewerName: string;
  onAccept: (itemId: string) => void;
  onReject: (itemId: string, reason: string) => void;
  onEdit: (itemId: string, content: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const visible = agentFilter ? items.filter((item) => item.itemType === agentFilter) : items;
  const draftCount = items.filter((item) => item.status === "DRAFT").length;

  function startEdit(item: ReviewQueueItem) {
    setEditingId(item.id);
    setEditDraft(item.content ?? item.summary);
  }

  function saveEdit(itemId: string) {
    onEdit(itemId, editDraft);
    setEditingId(null);
    setEditDraft("");
  }

  function confirmReject(itemId: string) {
    onReject(itemId, rejectReason);
    setRejectingId(null);
    setRejectReason("");
  }

  return (
    <section className="panel stack gp-panel gp-panel--queue">
      <div className="gp-panel__header">
        <p className="gp-panel__eyebrow">Column B · AI review queue</p>
        <h2>HITL staging queue</h2>
        <div className="pill-row">
          <span className="pill">{items.length} items</span>
          <span className="pill">{draftCount} draft</span>
          {agentFilter ? <span className="pill">Filtered</span> : null}
        </div>
      </div>

      <div className="list gp-queue-list">
        {visible.length ? (
          visible.map((item) => (
            <article className="gp-queue-item" key={item.id}>
              <div className="gp-queue-item__header">
                <AgentBadge agentId={item.agentId} />
                <QueueStatusBadge status={item.status} />
              </div>
              <strong>{item.title}</strong>
              <p>{item.summary}</p>

              {editingId === item.id ? (
                <div className="stack stack--tight">
                  <textarea
                    onChange={(event) => setEditDraft(event.target.value)}
                    rows={6}
                    value={editDraft}
                  />
                  <div className="actions">
                    <button className="button primary" onClick={() => saveEdit(item.id)} type="button">
                      Save edit
                    </button>
                    <button className="button secondary" onClick={() => setEditingId(null)} type="button">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : item.content ? (
                <pre className="gp-queue-content">{item.content}</pre>
              ) : null}

              {item.status === "DRAFT" ? (
                <div className="actions gp-queue-actions">
                  <button
                    className="button primary"
                    disabled={!reviewerName.trim()}
                    onClick={() => onAccept(item.id)}
                    type="button"
                  >
                    Accept
                  </button>
                  <button className="button secondary" disabled={!reviewerName.trim()} onClick={() => startEdit(item)} type="button">
                    Edit
                  </button>
                  <button
                    className="button secondary"
                    disabled={!reviewerName.trim()}
                    onClick={() => setRejectingId(item.id)}
                    type="button"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <p className="meta">
                  {item.status} by {item.decidedBy ?? "reviewer"}
                  {item.decidedAt ? ` at ${item.decidedAt}` : ""}
                  {item.rejectionReason ? ` · ${item.rejectionReason}` : ""}
                </p>
              )}

              {rejectingId === item.id ? (
                <div className="stack stack--tight">
                  <input
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Rejection reason (optional)"
                    value={rejectReason}
                  />
                  <div className="actions">
                    <button className="button primary" onClick={() => confirmReject(item.id)} type="button">
                      Confirm reject
                    </button>
                    <button className="button secondary" onClick={() => setRejectingId(null)} type="button">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No queue items</strong>
              <p>No agent outputs match the current filter.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
