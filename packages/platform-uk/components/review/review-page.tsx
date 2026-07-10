"use client";
import { useMemo } from "react";

import { CaseList } from "@/components/review/case-list";
import { deriveCaseFeedbackSummary } from "@/lib/feedback-insights";
import { useFeedbackState } from "@/lib/use-feedback-state";
import { useReviewCases } from "@/lib/use-review-cases";
import { deriveAcceptanceBlockers, deriveDataCollectionProfile, deriveMeetingOutcomePriority, deriveSafetyFlags } from "@/lib/workflow";

const queueFilters = [
  {
    id: "all",
    label: "All Cases",
    description: "Every case currently visible in your review workspace."
  },
  {
    id: "blocked",
    label: "Blocked",
    description: "Cases with unresolved structural blockers before acceptance."
  },
  {
    id: "high-risk",
    label: "High Risk",
    description: "Cases with at least one high-severity safety flag."
  },
  {
    id: "pending",
    label: "Pending",
    description: "Cases awaiting the next clinician review action."
  },
  {
    id: "deferred",
    label: "Deferred",
    description: "Cases deferred for additional clarification."
  },
  {
    id: "accepted",
    label: "Accepted",
    description: "Cases already finalized and ready for downstream use."
  },
  {
    id: "follow-up",
    label: "Follow Up",
    description: "Cases with linked stakeholder concerns, action items, or low-readiness feedback."
  },
  {
    id: "demo-ready",
    label: "High Confidence",
    description: "Cases with strong readiness signals and low active friction from linked feedback."
  },
  {
    id: "remediation",
    label: "Remediation",
    description: "Cases still in the remediation stream and not ready for pilot-prep reuse."
  },
  {
    id: "pilot-prep",
    label: "Deployment Prep",
    description: "Cases positioned for training, rollout preparation, or downstream operational use."
  },
  {
    id: "rwe-candidate",
    label: "Evidence Ready",
    description: "Accepted reviewed artifacts suitable for evidence packaging and reporting."
  },
  {
    id: "promoted",
    label: "Promoted",
    description: "Cases explicitly moved forward during internal validation meetings."
  },
  {
    id: "needs-evidence",
    label: "Needs Evidence",
    description: "Cases held back in meetings because stronger evidence is still required."
  },
  {
    id: "carryover",
    label: "Carryover",
    description: "Cases carried into explicit remediation or hold follow-through after meeting review."
  }
] as const;

export type QueueFilterId = (typeof queueFilters)[number]["id"];

export function ReviewPageClient({
  demoMode = false,
  initialFilter = "all",
  recordingMode = false
}: {
  demoMode?: boolean;
  initialFilter?: QueueFilterId;
  recordingMode?: boolean;
}) {
  const { cases, isLoaded } = useReviewCases();
  const { archive, isLoaded: feedbackLoaded } = useFeedbackState();

  const activeFilter = initialFilter;
  const filteredCases = useMemo(() => {
    if (!isLoaded || !feedbackLoaded) return [];

    if (activeFilter === "blocked") {
      return cases.filter((item) => deriveAcceptanceBlockers(item).length > 0);
    }

    if (activeFilter === "high-risk") {
      return cases.filter((item) => deriveSafetyFlags(item).some((flag) => flag.severity === "high"));
    }

    if (activeFilter === "pending") {
      return cases.filter((item) => item.status === "pending_review");
    }

    if (activeFilter === "deferred") {
      return cases.filter((item) => item.status === "deferred");
    }

    if (activeFilter === "accepted") {
      return cases.filter((item) => item.status === "accepted");
    }

    if (activeFilter === "follow-up") {
      return cases.filter((item) => deriveCaseFeedbackSummary(item.id, archive).priority === "follow_up");
    }

    if (activeFilter === "demo-ready") {
      return cases.filter((item) => deriveCaseFeedbackSummary(item.id, archive).priority === "demo_ready");
    }

    if (activeFilter === "remediation") {
      return cases.filter((item) => (item.dataCollectionProfile ?? deriveDataCollectionProfile(item)).validationStream === "phase_1_remediation");
    }

    if (activeFilter === "pilot-prep") {
      return cases.filter((item) => (item.dataCollectionProfile ?? deriveDataCollectionProfile(item)).validationStream === "ics_pilot_preparation");
    }

    if (activeFilter === "rwe-candidate") {
      return cases.filter((item) => (item.dataCollectionProfile ?? deriveDataCollectionProfile(item)).validationStream === "rwe_pipeline_candidate");
    }

    if (activeFilter === "promoted") {
      return cases.filter((item) => deriveMeetingOutcomePriority(item).priority === "promote");
    }

    if (activeFilter === "needs-evidence") {
      return cases.filter((item) => deriveMeetingOutcomePriority(item).priority === "needs_evidence");
    }

    if (activeFilter === "carryover") {
      return cases.filter((item) => {
        const priority = deriveMeetingOutcomePriority(item).priority;
        return priority === "remediation_carryover" || priority === "hold";
      });
    }

    return cases;
  }, [activeFilter, archive, cases, isLoaded, feedbackLoaded]);
  
  const activeDefinition = queueFilters.find((item) => item.id === activeFilter) ?? queueFilters[0];

  if (!isLoaded || !feedbackLoaded) {
    return <div className="panel">Loading review queue...</div>;
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <div className="actions">
          {queueFilters.map((filter) => (
            <a
              className={`button ${activeFilter === filter.id ? "primary" : "secondary"}`}
              href={
                filter.id === "all"
                  ? `/review${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`
                  : `/review?filter=${filter.id}${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`
              }
              key={filter.id}
            >
              {filter.label}
            </a>
          ))}
        </div>
        <div className="row">
          <div>
            <strong>{activeDefinition.label}</strong>
            <p>{activeDefinition.description}</p>
          </div>
          <span className="tag ok">{filteredCases.length} cases</span>
        </div>
      </div>

      <CaseList
        cases={filteredCases}
        feedbackArchive={archive}
        demoMode={demoMode}
        recordingMode={recordingMode}
        emptyMessage={`No cases currently match the "${activeDefinition.label}" view.`}
      />
    </div>
  );
}
