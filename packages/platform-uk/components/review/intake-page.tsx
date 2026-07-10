"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { syntheticSourceProfiles, sourceProfileLabel } from "@/lib/synthetic-source-profiles";
import {
  createReviewCaseFromIntake,
  deriveClinicalConcerns,
  deriveFinalizationState,
  deriveSafetyFlags,
  draftSectionsFromBundle,
  finalizationStateLabel,
  type IntakeGenerationOptions
} from "@/lib/workflow";
import type { ConsultationInput, ReviewCase } from "@/lib/types";
import { AudioRecorder } from "@/components/review/audio-recorder";

type IntakeDiffItem = {
  id: string;
  label: string;
  before: string;
  after: string;
  changeType: "changed" | "added" | "removed";
};

function parseCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatValue(value: string | undefined) {
  return value?.trim() ? value : "Not generated";
}

function buildObservationMap(reviewCase: ReviewCase | null) {
  return new Map((reviewCase?.draft.observations ?? []).map((observation) => [observation.codeText, observation.valueText]));
}

function buildIntakeDiff(currentCase: ReviewCase | null, baselineCase: ReviewCase | null) {
  if (!currentCase || !baselineCase) {
    return [];
  }

  const changes: IntakeDiffItem[] = [];
  const pushIfChanged = (id: string, label: string, before: string | undefined, after: string | undefined) => {
    const normalizedBefore = formatValue(before);
    const normalizedAfter = formatValue(after);

    if (normalizedBefore === normalizedAfter) {
      return;
    }

    const changeType =
      normalizedBefore === "Not generated" ? "added" : normalizedAfter === "Not generated" ? "removed" : "changed";

    changes.push({
      id,
      label,
      before: normalizedBefore,
      after: normalizedAfter,
      changeType
    });
  };

  pushIfChanged("encounter-reason", "Encounter reason", baselineCase.draft.encounter.reason, currentCase.draft.encounter.reason);
  pushIfChanged("condition", "Condition", baselineCase.draft.condition.codeText, currentCase.draft.condition.codeText);
  pushIfChanged(
    "medication",
    "Medication request",
    baselineCase.draft.medicationRequest?.medicationText,
    currentCase.draft.medicationRequest?.medicationText
  );

  const baselineObservations = buildObservationMap(baselineCase);
  const currentObservations = buildObservationMap(currentCase);
  const observationLabels = new Set([...baselineObservations.keys(), ...currentObservations.keys()]);

  for (const label of observationLabels) {
    pushIfChanged(`observation-${label}`, `${label} observation`, baselineObservations.get(label), currentObservations.get(label));
  }

  const baselineFlags = new Map(deriveSafetyFlags(baselineCase).map((flag) => [flag.label, flag]));
  const currentFlags = new Map(deriveSafetyFlags(currentCase).map((flag) => [flag.label, flag]));
  const flagLabels = new Set([...baselineFlags.keys(), ...currentFlags.keys()]);

  for (const label of flagLabels) {
    const beforeFlag = baselineFlags.get(label);
    const afterFlag = currentFlags.get(label);
    pushIfChanged(
      `flag-${label}`,
      `Safety flag: ${label}`,
      beforeFlag ? `${beforeFlag.severity}: ${beforeFlag.detail}` : undefined,
      afterFlag ? `${afterFlag.severity}: ${afterFlag.detail}` : undefined
    );
  }

  return changes;
}

export function IntakePage({
  demoMode = false,
  recordingMode = false
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const router = useRouter();
  const [patientLabel, setPatientLabel] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [sourceType, setSourceType] = useState<ConsultationInput["sourceType"]>("note");
  const [sourceProfile, setSourceProfile] = useState<ConsultationInput["sourceProfile"]>("voice_note_intake");
  const [pathwayHint, setPathwayHint] = useState<IntakeGenerationOptions["pathwayHint"]>("auto");
  const [confidenceMode, setConfidenceMode] = useState<IntakeGenerationOptions["confidenceMode"]>("auto");
  const [includeMedicationDraft, setIncludeMedicationDraft] = useState(true);
  const [allergyOverrides, setAllergyOverrides] = useState("");
  const [currentMedicationOverrides, setCurrentMedicationOverrides] = useState("");
  const [medicationMentionOverride, setMedicationMentionOverride] = useState("");
  const [bloodPressureOverride, setBloodPressureOverride] = useState("");
  const [temperatureOverride, setTemperatureOverride] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inferredContextOverrides = useMemo(
    () => ({
      allergies: parseCommaSeparated(allergyOverrides),
      currentMedications: parseCommaSeparated(currentMedicationOverrides),
      medicationMention: medicationMentionOverride.trim(),
      bloodPressure: bloodPressureOverride.trim(),
      temperature: temperatureOverride.trim()
    }),
    [allergyOverrides, bloodPressureOverride, currentMedicationOverrides, medicationMentionOverride, temperatureOverride]
  );

  const previewCase = useMemo(() => {
    if (!rawInput.trim()) {
      return null;
    }

    return createReviewCaseFromIntake({
      options: {
        pathwayHint,
        confidenceMode,
        includeMedicationDraft,
        sourceProfile,
        inferredContextOverrides
      },
      patientLabel,
      rawInput,
      sourceType
    });
  }, [confidenceMode, includeMedicationDraft, inferredContextOverrides, pathwayHint, patientLabel, rawInput, sourceType]);

  const baselineCase = useMemo(() => {
    if (!rawInput.trim()) {
      return null;
    }

    return createReviewCaseFromIntake({
      options: {
        pathwayHint: "auto",
        confidenceMode: "auto",
        includeMedicationDraft: true,
        sourceProfile
      },
      patientLabel,
      rawInput,
      sourceType
    });
  }, [patientLabel, rawInput, sourceProfile, sourceType]);

  const previewSections = previewCase ? draftSectionsFromBundle(previewCase.draft) : [];
  const previewFlags = previewCase ? deriveSafetyFlags(previewCase) : [];
  const previewConcerns = previewCase ? deriveClinicalConcerns(previewCase).slice(0, 4) : [];
  const previewFinalizationState = previewCase ? deriveFinalizationState(previewCase) : null;
  const previewGenerationTrace = previewCase?.generationTrace ?? [];
  const diffItems = useMemo(
    () => buildIntakeDiff(previewCase, baselineCase),
    [baselineCase, previewCase]
  );
  const sharedQuery = `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  async function handleCreate() {
    if (!rawInput.trim()) {
      setError("Source input is required before generating a review case.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/review-cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "create",
          patientLabel,
          rawInput,
          sourceType,
          options: {
            pathwayHint,
            confidenceMode,
            includeMedicationDraft,
            sourceProfile,
            inferredContextOverrides
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create generated review case.");
      }

      const payload = (await response.json()) as { reviewCase: { id: string } };
      router.push(`/cases/${payload.reviewCase.id}${sharedQuery}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create generated review case.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="grid">
      <div className="span-12 panel stack">
        <div className="actions">
          <a className="button secondary" href={`/${sharedQuery}`}>
            Back To Dashboard
          </a>
          <a className="button secondary" href={`/review${sharedQuery}`}>
            Review Queue
          </a>
        </div>
        <h2>Source Intake</h2>
        <p>
          Start the workflow from source material: capture a note or transcript, generate a first-pass structured draft,
          then hand it into the existing clinician review flow.
        </p>
      </div>

      <div className="span-6 panel stack">
        <h3>Capture Input</h3>
        <AudioRecorder 
          onTranscriptionComplete={(t) => {
            setRawInput((prev) => (prev ? `${prev} ${t}` : t));
            setSourceType("transcript");
          }} 
        />
        <label className="stack" style={{ gap: 8 }}>
          <strong>Patient Label</strong>
          <input
            data-testid="intake-patient-label"
            onChange={(event) => setPatientLabel(event.target.value)}
            placeholder="Synthetic Intake Patient"
            style={{
              borderRadius: 14,
              border: "1px solid var(--line)",
              padding: 12,
              font: "inherit",
              color: "var(--ink)"
            }}
            value={patientLabel}
          />
        </label>
        <label className="stack" style={{ gap: 8 }}>
          <strong>Source Type</strong>
          <select
            onChange={(event) => setSourceType(event.target.value as ConsultationInput["sourceType"])}
            style={{
              borderRadius: 14,
              border: "1px solid var(--line)",
              padding: 12,
              font: "inherit",
              color: "var(--ink)"
            }}
            value={sourceType}
          >
            <option value="note">Clinical Note</option>
            <option value="transcript">Transcript</option>
          </select>
        </label>
        <label className="stack" style={{ gap: 8 }}>
          <strong>Synthetic Source Profile</strong>
          <select
            onChange={(event) => setSourceProfile(event.target.value as ConsultationInput["sourceProfile"])}
            style={{
              borderRadius: 14,
              border: "1px solid var(--line)",
              padding: 12,
              font: "inherit",
              color: "var(--ink)"
            }}
            value={sourceProfile}
          >
            {syntheticSourceProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label}
              </option>
            ))}
          </select>
        </label>
        <label className="stack" style={{ gap: 8 }}>
          <strong>Source Input</strong>
          <textarea
            data-testid="intake-source-input"
            onChange={(event) => setRawInput(event.target.value)}
            placeholder="Paste a consultation note or transcript here. Mention symptoms, medication, allergies, or missing data to exercise the proof."
            style={{
              width: "100%",
              minHeight: 220,
              borderRadius: 14,
              border: "1px solid var(--line)",
              padding: 12,
              font: "inherit",
              color: "var(--ink)"
            }}
            value={rawInput}
          />
        </label>
        <div className="panel stack" style={{ background: "var(--panel-alt)", boxShadow: "none" }}>
          <h3>Generation Controls</h3>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Pathway Hint</strong>
            <select
              onChange={(event) => setPathwayHint(event.target.value as IntakeGenerationOptions["pathwayHint"])}
              style={{
                borderRadius: 14,
                border: "1px solid var(--line)",
                padding: 12,
                font: "inherit",
                color: "var(--ink)"
              }}
              value={pathwayHint}
            >
              <option value="auto">Auto-detect</option>
              <option value="respiratory">Respiratory</option>
              <option value="hypertension">Hypertension</option>
              <option value="eczema">Eczema</option>
              <option value="lipid">Lipid</option>
              <option value="general">General</option>
            </select>
          </label>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Confidence Mode</strong>
            <select
              onChange={(event) => setConfidenceMode(event.target.value as IntakeGenerationOptions["confidenceMode"])}
              style={{
                borderRadius: 14,
                border: "1px solid var(--line)",
                padding: 12,
                font: "inherit",
                color: "var(--ink)"
              }}
              value={confidenceMode}
            >
              <option value="auto">Auto</option>
              <option value="conservative">Conservative</option>
              <option value="standard">Standard</option>
            </select>
          </label>
          <label className="actions" style={{ alignItems: "center" }}>
            <input checked={includeMedicationDraft} onChange={(event) => setIncludeMedicationDraft(event.target.checked)} type="checkbox" />
            <span>Allow medication draft generation when medication mentions are detected</span>
          </label>
        </div>
        <div className="panel stack" style={{ background: "var(--panel-alt)", boxShadow: "none" }}>
          <h3>Editable Inferred Context</h3>
          <p>Adjust the inferred clinical context before the case is created. Leave a field empty to keep the system inference.</p>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Allergies</strong>
            <input
              onChange={(event) => setAllergyOverrides(event.target.value)}
              placeholder={baselineCase?.safetyContext.allergies.join(", ") || "No inferred allergies"}
              style={{
                borderRadius: 14,
                border: "1px solid var(--line)",
                padding: 12,
                font: "inherit",
                color: "var(--ink)"
              }}
              value={allergyOverrides}
            />
          </label>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Current Medications</strong>
            <input
              onChange={(event) => setCurrentMedicationOverrides(event.target.value)}
              placeholder={baselineCase?.safetyContext.currentMedications.join(", ") || "No inferred current medications"}
              style={{
                borderRadius: 14,
                border: "1px solid var(--line)",
                padding: 12,
                font: "inherit",
                color: "var(--ink)"
              }}
              value={currentMedicationOverrides}
            />
          </label>
          <div className="diff-grid">
            <label className="stack" style={{ gap: 8 }}>
              <strong>Medication Mention</strong>
              <input
                onChange={(event) => setMedicationMentionOverride(event.target.value)}
                placeholder={baselineCase?.draft.medicationRequest?.medicationText || "No inferred medication mention"}
                style={{
                  borderRadius: 14,
                  border: "1px solid var(--line)",
                  padding: 12,
                  font: "inherit",
                  color: "var(--ink)"
                }}
                value={medicationMentionOverride}
              />
            </label>
            <label className="stack" style={{ gap: 8 }}>
              <strong>Blood Pressure</strong>
              <input
                onChange={(event) => setBloodPressureOverride(event.target.value)}
                placeholder={baselineCase?.draft.observations.find((observation) => observation.codeText === "Blood pressure")?.valueText || "No inferred blood pressure"}
                style={{
                  borderRadius: 14,
                  border: "1px solid var(--line)",
                  padding: 12,
                  font: "inherit",
                  color: "var(--ink)"
                }}
                value={bloodPressureOverride}
              />
            </label>
          </div>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Temperature</strong>
            <input
              onChange={(event) => setTemperatureOverride(event.target.value)}
              placeholder={baselineCase?.draft.observations.find((observation) => observation.codeText === "Temperature")?.valueText || "No inferred temperature"}
              style={{
                borderRadius: 14,
                border: "1px solid var(--line)",
                padding: 12,
                font: "inherit",
                color: "var(--ink)"
              }}
              value={temperatureOverride}
            />
          </label>
        </div>
        {error ? (
          <div className="panel" style={{ background: "var(--danger-soft)", boxShadow: "none" }}>
            {error}
          </div>
        ) : null}
        <div className="actions">
          <button className="button primary" disabled={isCreating || !previewCase} onClick={() => void handleCreate()} type="button">
            <span data-testid="intake-create-review-case" />
            {isCreating ? "Creating..." : "Create Review Case"}
          </button>
        </div>
        <div className="panel stack" style={{ background: "var(--panel-alt)", boxShadow: "none" }}>
          <h3>Suggested Source Fixtures</h3>
          <div className="actions">
            {syntheticSourceProfiles.map((profile) => (
              <button
                data-testid={`intake-load-${profile.id}`}
                className="button secondary"
                key={profile.id}
                onClick={() => {
                  setPatientLabel(profile.patientLabel);
                  setSourceType(profile.sourceType);
                  setSourceProfile(profile.id);
                  setRawInput(profile.text);
                  setPathwayHint(profile.pathwayHint);
                  setConfidenceMode(profile.confidenceMode);
                  setIncludeMedicationDraft(profile.includeMedicationDraft);
                  setAllergyOverrides("");
                  setCurrentMedicationOverrides("");
                  setMedicationMentionOverride("");
                  setBloodPressureOverride("");
                  setTemperatureOverride("");
                }}
                type="button"
              >
                Load {profile.label}
              </button>
            ))}
          </div>
          <p>
            Profiles cover voice or note intake, public-health and SDOH context, wearable monitoring, imaging or lab
            handoffs, genomics or family-history prompts, and synthetic EMIS or SystmOne placeholders.
          </p>
        </div>
      </div>

      <div className="span-6 panel stack">
        <h3>Generated Preview</h3>
        {previewCase ? (
          <>
            <div className="row">
              <div>
                <strong>{previewCase.patientLabel}</strong>
                <p>{previewCase.summary}</p>
              </div>
              <span className="tag ok">{previewCase.status}</span>
            </div>
            <div className="row">
              <div>
                <strong>Source confidence</strong>
                <p>{Math.round(previewCase.input.transcriptConfidence * 100)}%</p>
              </div>
              <div className="stack stack--actions">
                <span className="pill">{previewCase.input.sourceType}</span>
                <span className="pill">{sourceProfileLabel(previewCase.input.sourceProfile)}</span>
              </div>
            </div>
            <div className="row">
              <div>
                <strong>Finalization preview</strong>
                <p>
                  {previewFinalizationState
                    ? `${finalizationStateLabel(previewFinalizationState)} before reviewer action`
                    : "Pending generation"}
                </p>
              </div>
              <span className={`tag ${previewFinalizationState === "blocked" ? "danger" : previewFinalizationState === "warn" ? "warn" : "ok"}`}>
                {previewFinalizationState ?? "pending"}
              </span>
            </div>
            <div className="row">
              <div>
                <strong>Safety context inferred</strong>
                <p>
                  Allergies: {previewCase.safetyContext.allergies.length ? previewCase.safetyContext.allergies.join(", ") : "None inferred"}
                </p>
                <p>
                  Current meds: {previewCase.safetyContext.currentMedications.length ? previewCase.safetyContext.currentMedications.join(", ") : "None inferred"}
                </p>
              </div>
            </div>
            <div className="panel stack" style={{ background: "var(--panel-alt)", boxShadow: "none" }}>
              <h3>Derived Safety Flags</h3>
              <div className="list">
                {previewFlags.length ? (
                  previewFlags.map((flag) => (
                    <div className="row" key={flag.id}>
                      <div>
                        <strong>{flag.label}</strong>
                        <p>{flag.detail}</p>
                      </div>
                      <span className={`tag ${flag.severity === "high" ? "danger" : flag.severity === "medium" ? "warn" : "ok"}`}>
                        {flag.severity}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="row">
                    <div>
                      <strong>No immediate safety flags</strong>
                      <p>This generated draft looks structurally ready for review.</p>
                    </div>
                    <span className="tag ok">clear</span>
                  </div>
                )}
              </div>
            </div>
            <div className="panel stack" style={{ background: "var(--panel-alt)", boxShadow: "none" }}>
              <h3>Top Clinical Concerns</h3>
              <div className="list">
                {previewConcerns.length ? (
                  previewConcerns.map((concern) => (
                    <div className="row" key={concern.id}>
                      <div>
                        <strong>{concern.label}</strong>
                        <p>{concern.detail}</p>
                        <p>{concern.source}</p>
                      </div>
                      <span className={`tag ${concern.severity === "high" ? "danger" : concern.severity === "medium" ? "warn" : "ok"}`}>
                        {concern.severity}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="row">
                    <div>
                      <strong>No active clinical concerns</strong>
                      <p>The generated draft currently looks clean before review.</p>
                    </div>
                    <span className="tag ok">clear</span>
                  </div>
                )}
              </div>
            </div>
            <div className="panel stack" style={{ background: "var(--panel-alt)", boxShadow: "none" }}>
              <div className="row">
                <div>
                  <strong>Regeneration Diff</strong>
                  <p>Compare the current assumptions against the default auto-generated draft before creating the case.</p>
                </div>
                <span className="pill">{diffItems.length} change{diffItems.length === 1 ? "" : "s"}</span>
              </div>
              <div className="list">
                {diffItems.length ? (
                  diffItems.map((item) => (
                    <div className="diff-card" key={item.id}>
                      <div className="row" style={{ border: 0, background: "transparent", padding: 0 }}>
                        <div>
                          <strong>{item.label}</strong>
                        </div>
                        <span className={`tag ${item.changeType === "removed" ? "danger" : item.changeType === "added" ? "ok" : "warn"}`}>
                          {item.changeType}
                        </span>
                      </div>
                      <div className="diff-grid">
                        <div className="diff-pane">
                          <strong>Baseline</strong>
                          <p>{item.before}</p>
                        </div>
                        <div className="diff-pane">
                          <strong>Current</strong>
                          <p>{item.after}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="row">
                    <div>
                      <strong>No regeneration changes yet</strong>
                      <p>The current preview matches the default auto-generated intake result.</p>
                    </div>
                    <span className="tag ok">matched</span>
                  </div>
                )}
              </div>
            </div>
            <div className="panel stack" style={{ background: "var(--panel-alt)", boxShadow: "none" }}>
              <h3>Generation Trace</h3>
              <div className="list">
                {previewGenerationTrace.map((item) => (
                  <div className="row" key={item.id}>
                    <div>
                      <strong>{item.fieldLabel}</strong>
                      <p>Source: {item.sourceSnippet}</p>
                      <p>Output: {item.inferredValue}</p>
                      <p>Target: {item.fieldPath}</p>
                      <p>{item.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="list">
              {previewSections.map((section) => (
                <div className="row" key={section.id}>
                  <div>
                    <strong>{section.title}</strong>
                    {section.fields.map((field) => (
                      <p key={`${section.id}-${field.key}`}>
                        {field.label}: {field.value}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="row">
            <div>
              <strong>No generated draft yet</strong>
              <p>Enter source text on the left to preview how the intake flow will create a first-pass review case.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
