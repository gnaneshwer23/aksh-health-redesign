"use client";

import type { OpsAnalytics } from "./ops-dashboard-section-types";

export function FeedbackSignalsCard({ feedbackAnalytics }: { feedbackAnalytics: OpsAnalytics["feedbackAnalytics"] }) {
  return (
    <div className="span-6 panel stack">
      <h3>Feedback Signals</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>High-readiness sessions</strong>
            <p>Sessions scored 4 or 5 and likely reusable as-is.</p>
          </div>
          <span className="pill">{feedbackAnalytics.highReadiness}</span>
        </div>
        <div className="row">
          <div>
            <strong>Active archive</strong>
            <p>Saved sessions contributing to feedback trend analysis.</p>
          </div>
          <span className="pill">{feedbackAnalytics.total}</span>
        </div>
        <div className="row">
          <div>
            <strong>Open follow-up sessions</strong>
            <p>Linked objections or action items that are still being treated as active work.</p>
          </div>
          <span className="pill">{feedbackAnalytics.openSessions}</span>
        </div>
        <div className="row">
          <div>
            <strong>Resolved sessions</strong>
            <p>Feedback entries marked closed out and no longer counted as active follow-up.</p>
          </div>
          <span className="pill">{feedbackAnalytics.resolvedSessions}</span>
        </div>
      </div>
    </div>
  );
}

export function FeedbackPhrasePanels({ feedbackAnalytics }: { feedbackAnalytics: OpsAnalytics["feedbackAnalytics"] }) {
  return (
    <>
      <div className="span-4 panel stack">
        <h3>Recurring Objections</h3>
        <div className="list">
          {feedbackAnalytics.objections.length ? (
            feedbackAnalytics.objections.map((item) => (
              <div className="row" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                </div>
                <span className="pill">{item.count}</span>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No archived objections yet</strong>
                <p>Save feedback sessions to populate this panel.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="span-4 panel stack">
        <h3>Strongest Proof Moments</h3>
        <div className="list">
          {feedbackAnalytics.strongestMoments.length ? (
            feedbackAnalytics.strongestMoments.map((item) => (
              <div className="row" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                </div>
                <span className="pill">{item.count}</span>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No archived proof moments yet</strong>
                <p>Save feedback sessions to surface repeated strengths.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="span-4 panel stack">
        <h3>Common Next Actions</h3>
        <div className="list">
          {feedbackAnalytics.nextActions.length ? (
            feedbackAnalytics.nextActions.map((item) => (
              <div className="row" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                </div>
                <span className="pill">{item.count}</span>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No archived next actions yet</strong>
                <p>Save feedback sessions to build a reusable improvement backlog.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function FeedbackLinkedCasesPanel({
  feedbackAnalytics,
  sharedQuery
}: {
  feedbackAnalytics: OpsAnalytics["feedbackAnalytics"];
  sharedQuery: string;
}) {
  return (
    <div className="span-12 panel stack">
      <h3>Most-Referenced Cases In Feedback</h3>
      <div className="list">
        {feedbackAnalytics.linkedCases.length ? (
          feedbackAnalytics.linkedCases.map((item) => (
            <div className="row" key={item.caseId}>
              <div>
                <strong>{item.caseId}</strong>
                <p>Saved feedback sessions explicitly linked to this demo case.</p>
              </div>
              <div className="actions">
                <span className="pill">{item.count} mentions</span>
                <a className="button secondary" href={`/cases/${item.caseId}${sharedQuery}`}>
                  Case
                </a>
                <a className="button secondary" href={`/cases/${item.caseId}/evidence${sharedQuery}`}>
                  Evidence
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No linked cases yet</strong>
              <p>Link a demo case while saving feedback to correlate objections and proof points to specific scenarios.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
