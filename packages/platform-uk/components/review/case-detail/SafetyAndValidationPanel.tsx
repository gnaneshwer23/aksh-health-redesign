import type {
  ChecklistItem,
  ClinicalConcern,
  DataCollectionProfile,
  FinalizationState,
  ReviewerGuidance,
  SafetyFlag,
  TransitionChecklistItem,
  ValidationProtocol,
  ValidationReadiness
} from "@/lib/types";
import { finalizationStateLabel } from "@/lib/workflow";

function urgencyTone(value: "low" | "medium" | "high") {
  if (value === "high") return "danger";
  if (value === "medium") return "warn";
  return "ok";
}

function finalizationTone(value: FinalizationState) {
  if (value === "blocked") return "danger";
  if (value === "warn") return "warn";
  return "ok";
}

function scoreTone(value: number) {
  if (value >= 80) return "ok";
  if (value >= 60) return "warn";
  return "danger";
}

export function SafetyAndValidationPanel({
  safetyFlags,
  acceptanceBlockers,
  finalizationState,
  checklistAcceptanceBlockers,
  validationReadiness,
  validationProtocol,
  clinicalConcerns,
  reviewerGuidance,
  reviewerChecklist,
  transitionChecklist,
  dataCollectionProfile,
  isAccepted,
  toggleChecklistItem,
  updateChecklistNote
}: {
  safetyFlags: SafetyFlag[];
  acceptanceBlockers: string[];
  finalizationState: FinalizationState;
  checklistAcceptanceBlockers: string[];
  validationReadiness: ValidationReadiness;
  validationProtocol: ValidationProtocol;
  clinicalConcerns: ClinicalConcern[];
  reviewerGuidance: ReviewerGuidance[];
  reviewerChecklist: ChecklistItem[];
  transitionChecklist: TransitionChecklistItem[];
  dataCollectionProfile: DataCollectionProfile;
  isAccepted: boolean;
  toggleChecklistItem: (itemId: string, completed: boolean) => void;
  updateChecklistNote: (itemId: string, note: string) => void;
}) {
  return (
    <div className="stack">
      <div className="panel stack">
        <h3>Validation Readiness</h3>
        <div className="list">
          <div className="row">
            <div>
              <strong>{validationReadiness.label}</strong>
              <p>{validationReadiness.nextStep}</p>
            </div>
            <span className={`tag ${urgencyTone(validationReadiness.urgency)}`}>{validationReadiness.urgency}</span>
          </div>
          <div className="row">
            <div>
              <strong>Clinical finalization state</strong>
              <p>
                {finalizationState === "blocked"
                  ? "Case cannot be finalized until blocking structural or override requirements are resolved."
                  : finalizationState === "warn"
                    ? "Case is reviewable, but warning-level validation or safety concerns still need attention."
                    : "Case is structurally ready and has no remaining warning-level validation concerns."}
              </p>
            </div>
            <span className={`tag ${finalizationTone(finalizationState)}`}>{finalizationStateLabel(finalizationState)}</span>
          </div>
          <div className="row">
            <div>
              <strong>Open blockers</strong>
              <p>{validationReadiness.blockerCount} blocker(s), {validationReadiness.highConcernCount} high-priority concern(s).</p>
            </div>
            <span className="pill">{validationReadiness.blockerCount}</span>
          </div>
        </div>
      </div>

      <div className="panel stack">
        <h3>Validation Protocol</h3>
        <div className="list">
          <div className="row">
            <div>
              <strong>Promotion recommendation</strong>
              <p>{validationProtocol.promotionRecommendation.replaceAll("_", " ")}</p>
              <p>{validationProtocol.summary}</p>
            </div>
            <span className={`tag ${scoreTone(validationProtocol.overallScore)}`}>{validationProtocol.overallScore}</span>
          </div>
          {[
            ["Clinical completeness", validationProtocol.clinicalCompletenessScore],
            ["Safety review", validationProtocol.safetyReviewScore],
            ["Reviewer confidence", validationProtocol.reviewerConfidenceScore],
            ["Export quality", validationProtocol.exportQualityScore]
          ].map(([label, score]) => (
            <div className="row" key={label}>
              <div>
                <strong>{label}</strong>
                <p>Current validation score for this evidence dimension.</p>
              </div>
              <span className="pill">{score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel stack">
        <h3>Safety And Blockers</h3>
        {acceptanceBlockers.length || checklistAcceptanceBlockers.length ? (
          [...acceptanceBlockers, ...checklistAcceptanceBlockers].map((blocker) => (
            <div className="row" key={blocker}>
              <div>
                <strong>Blocked</strong>
                <p>{blocker}</p>
              </div>
              <span className="tag danger">blocked</span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>{finalizationState === "warn" ? "Ready with warnings" : "Ready for acceptance"}</strong>
              <p>No active structural blockers remain for the draft.</p>
            </div>
            <span className={`tag ${finalizationTone(finalizationState)}`}>{finalizationState}</span>
          </div>
        )}
        {safetyFlags.length ? (
          safetyFlags.map((flag) => (
            <div className="row" key={flag.id}>
              <div>
                <strong>{flag.label}</strong>
                <p>{flag.detail}</p>
              </div>
              <span className={`tag ${urgencyTone(flag.severity)}`}>{flag.severity}</span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No active safety flags</strong>
              <p>This case is ready for clinician review.</p>
            </div>
            <span className="tag ok">clear</span>
          </div>
        )}
      </div>

      <div className="panel stack">
        <h3>Ranked Clinical Concerns</h3>
        {clinicalConcerns.length ? (
          clinicalConcerns.slice(0, 6).map((concern) => (
            <div className="row" key={concern.id}>
              <div>
                <strong>{concern.label}</strong>
                <p>{concern.detail}</p>
                <p>{concern.source}</p>
              </div>
              <span className={`tag ${urgencyTone(concern.severity)}`}>{concern.severity}</span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No active concerns</strong>
              <p>The current draft has no blocker, safety, or validation concern in the ranked view.</p>
            </div>
            <span className="tag ok">clear</span>
          </div>
        )}
      </div>

      <div className="panel stack">
        <h3>Reviewer Guidance</h3>
        {reviewerGuidance.length ? (
          reviewerGuidance.map((item) => (
            <div className="row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.instruction}</p>
                <p>{item.category.replace("_", " ")}</p>
              </div>
              <span className={`tag ${urgencyTone(item.severity)}`}>{item.severity}</span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No extra reviewer prompts</strong>
              <p>The current case does not need additional confirmation or override guidance beyond the ranked concerns.</p>
            </div>
            <span className="tag ok">clear</span>
          </div>
        )}
      </div>

      <div className="panel stack">
        <h3>Reviewer Checklist</h3>
        {reviewerChecklist.length ? (
          reviewerChecklist.map((item) => (
            <div className="row" key={item.id} style={{ alignItems: "flex-start", gap: 12 }}>
              <input
                checked={item.completed}
                disabled={isAccepted}
                onChange={(event) => toggleChecklistItem(item.id, event.target.checked)}
                type="checkbox"
              />
              <div style={{ flex: 1 }} className="stack">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.category.replace("_", " ")}</p>
                  <p>{item.completed ? `Completed by ${item.completedBy ?? "reviewer"} at ${item.completedAt ?? "unknown time"}` : "Not yet completed"}</p>
                </div>
                <label className="stack" style={{ gap: 8 }}>
                  <span className="meta">Confirmation note</span>
                  <textarea
                    disabled={isAccepted}
                    onChange={(event) => updateChecklistNote(item.id, event.target.value)}
                    placeholder="Add a short confirmation note or rationale."
                    style={{
                      width: "100%",
                      minHeight: 72,
                      borderRadius: 14,
                      border: "1px solid var(--line)",
                      padding: 12,
                      font: "inherit",
                      color: "var(--ink)"
                    }}
                    value={item.confirmationNote ?? ""}
                  />
                </label>
              </div>
              <span className={`tag ${item.completed ? "ok" : item.category === "missing_evidence" ? "warn" : "danger"}`}>
                {item.completed ? "done" : "open"}
              </span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No checklist items</strong>
              <p>No checklist completion is required for the current case.</p>
            </div>
            <span className="tag ok">clear</span>
          </div>
        )}
      </div>

      <div className="panel stack">
        <h3>Stream Transition Checklist</h3>
        <div className="list">
          {transitionChecklist.map((item) => (
            <div className="row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.phase === "to_pilot_prep" ? "To pilot prep" : "To RWE candidate"}</p>
                <p>{item.detail}</p>
              </div>
              <span className={`tag ${item.status === "done" ? "ok" : "warn"}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel stack">
        <h3>Data Collection Strategy</h3>
        <div className="list">
          <div className="row">
            <div>
              <strong>{dataCollectionProfile.datasetLabel}</strong>
              <p>{dataCollectionProfile.provenance}</p>
            </div>
            <span className="pill">{dataCollectionProfile.ingestionStatus}</span>
          </div>
          <div className="row">
            <div>
              <strong>Validation stream</strong>
              <p>{dataCollectionProfile.validationStream}</p>
            </div>
            <span className="pill">{dataCollectionProfile.trainingReadiness}</span>
          </div>
          <div className="row">
            <div>
              <strong>Safety governance</strong>
              <p>{dataCollectionProfile.safetyGovernance}</p>
            </div>
          </div>
          {dataCollectionProfile.collectionNotes.map((note) => (
            <div className="row" key={note}>
              <div>
                <strong>Collection note</strong>
                <p>{note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
