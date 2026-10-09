import type { ReviewCase } from "./types";
import { createFrozenArtifact } from "./workflow";

export const reviewCases: ReviewCase[] = [
  {
    id: "case-001",
    userId: "demo",
    patientLabel: "Synthetic Patient A",
    status: "pending_review",
    updatedAt: "2026-04-22 21:45",
    summary: "Acute cough review with medication history and possible penicillin allergy conflict.",
    input: {
      sourceType: "transcript",
      capturedAt: "2026-04-22 21:40",
      summary: "Transcript references cough, fever, and likely amoxicillin suggestion after prior medication discussion.",
      transcriptConfidence: 0.62
    },
    safetyContext: {
      allergies: ["penicillin"],
      currentMedications: ["clarithromycin"]
    },
    draft: {
      encounter: {
        resourceType: "Encounter",
        id: "encounter-001",
        className: "primary-care",
        reason: "Acute respiratory complaint",
        clinicianSummary: "Primary care consultation for acute cough and fever symptoms."
      },
      condition: {
        resourceType: "Condition",
        id: "condition-001",
        codeText: "Viral upper respiratory infection",
        clinicalStatus: "provisional",
        evidence: "Dry cough, fever, no chest pain, no severe dyspnea reported."
      },
      medicationRequest: {
        resourceType: "MedicationRequest",
        id: "medreq-001",
        medicationText: "Amoxicillin",
        dosageInstruction: "500mg three times daily",
        reason: "Empiric treatment draft pending clinician confirmation",
        confidence: 0.58
      },
      observations: [
        {
          resourceType: "Observation",
          id: "obs-001",
          codeText: "Temperature",
          valueText: "Fever reported by patient",
          status: "preliminary"
        },
        {
          resourceType: "Observation",
          id: "obs-002",
          codeText: "Red flag symptoms",
          valueText: "No chest pain or oxygen concerns reported",
          status: "final"
        }
      ]
    },
    auditEvents: [
      { id: "evt-1", category: "system", label: "Input received", actor: "system", timestamp: "21:40" },
      { id: "evt-2", category: "system", label: "Draft generated", actor: "system", timestamp: "21:41" },
      { id: "evt-3", category: "system", label: "Safety checks completed", actor: "system", timestamp: "21:42" }
    ],
    reviewSummary: {},
    fieldChanges: [],
    expectedOutcome: {
      scenarioClass: "medication allergy",
      expectedFinalizationState: "blocked",
      expectedSafetyLabels: ["Possible allergy conflict", "Medication interaction review needed", "Low-confidence medication extraction"],
      expectedBlockerIncludes: ["high-severity issue"],
      expectedPromotionRecommendation: "hold_in_remediation"
    }
  },
  {
    id: "case-002",
    userId: "demo",
    patientLabel: "Synthetic Patient B",
    status: "deferred",
    updatedAt: "2026-04-22 20:30",
    summary: "Hypertension follow-up with missing blood pressure observation fields.",
    input: {
      sourceType: "note",
      capturedAt: "2026-04-22 20:18",
      summary: "Structured note references routine blood pressure follow-up but omits exact reading values.",
      transcriptConfidence: 0.91
    },
    safetyContext: {
      allergies: [],
      currentMedications: ["amlodipine"]
    },
    draft: {
      encounter: {
        resourceType: "Encounter",
        id: "encounter-002",
        className: "primary-care",
        reason: "Hypertension follow-up",
        clinicianSummary: "Routine chronic disease review."
      },
      condition: {
        resourceType: "Condition",
        id: "condition-002",
        codeText: "Hypertension",
        clinicalStatus: "active",
        evidence: "Known chronic condition reviewed during follow-up."
      },
      observations: [
        {
          resourceType: "Observation",
          id: "obs-003",
          codeText: "Blood pressure",
          valueText: "",
          status: "preliminary"
        }
      ]
    },
    auditEvents: [
      { id: "evt-4", category: "system", label: "Input received", actor: "system", timestamp: "20:18" },
      { id: "evt-5", category: "system", label: "Draft generated", actor: "system", timestamp: "20:19" },
      {
        id: "evt-6",
        category: "reviewer_decision",
        label: "Deferred by reviewer",
        actor: "Dr Patel",
        timestamp: "20:30",
        detail: "Need exact blood pressure reading before finalizing."
      }
    ],
    reviewSummary: {
      lastReviewer: "Dr Patel",
      lastDecision: "defer",
      lastDecisionAt: "2026-04-22 20:30",
      reviewerNotes: "Need exact blood pressure reading before finalizing.",
      overrideReason: ""
    },
    fieldChanges: [],
    expectedOutcome: {
      scenarioClass: "incomplete vitals",
      expectedFinalizationState: "blocked",
      expectedSafetyLabels: ["Missing required observation field"],
      expectedBlockerIncludes: ["Blood pressure observation is incomplete"],
      expectedValidationLabels: ["Blood pressure value missing"],
      expectedPromotionRecommendation: "hold_in_remediation"
    }
  },
  {
    id: "case-003",
    userId: "demo",
    patientLabel: "Synthetic Patient C",
    status: "pending_review",
    updatedAt: "2026-04-22 19:25",
    summary: "Straightforward eczema medication renewal with complete structured documentation.",
    input: {
      sourceType: "note",
      capturedAt: "2026-04-22 19:20",
      summary: "Brief consultation note requesting repeat topical treatment for stable eczema flare.",
      transcriptConfidence: 0.96
    },
    safetyContext: {
      allergies: [],
      currentMedications: ["emollient cream"]
    },
    draft: {
      encounter: {
        resourceType: "Encounter",
        id: "encounter-003",
        className: "primary-care",
        reason: "Repeat medication review",
        clinicianSummary: "Stable eczema symptoms reviewed during brief follow-up."
      },
      condition: {
        resourceType: "Condition",
        id: "condition-003",
        codeText: "Eczema",
        clinicalStatus: "active",
        evidence: "Known eczema with mild flare and no systemic concerns."
      },
      medicationRequest: {
        resourceType: "MedicationRequest",
        id: "medreq-003",
        medicationText: "Hydrocortisone 1% cream",
        dosageInstruction: "Apply twice daily for 7 days",
        reason: "Repeat topical treatment for eczema flare",
        confidence: 0.93
      },
      observations: [
        {
          resourceType: "Observation",
          id: "obs-004",
          codeText: "Skin review",
          valueText: "Localized erythematous rash, no infection signs",
          status: "final"
        }
      ]
    },
    auditEvents: [
      { id: "evt-7", category: "system", label: "Input received", actor: "system", timestamp: "19:20" },
      { id: "evt-8", category: "system", label: "Draft generated", actor: "system", timestamp: "19:21" },
      { id: "evt-9", category: "system", label: "Safety checks completed", actor: "system", timestamp: "19:22" }
    ],
    reviewSummary: {},
    fieldChanges: [],
    expectedOutcome: {
      scenarioClass: "straightforward eczema",
      expectedFinalizationState: "ready",
      expectedPromotionRecommendation: "ready_for_pilot_prep"
    }
  },
  {
    id: "case-004",
    userId: "demo",
    patientLabel: "Synthetic Patient D",
    status: "pending_review",
    updatedAt: "2026-04-22 18:10",
    summary: "Medication review with statin draft against documented previous adverse reaction and incomplete observation.",
    input: {
      sourceType: "transcript",
      capturedAt: "2026-04-22 18:04",
      summary: "Transcript references cholesterol review, prior muscle aches on statin therapy, and missing blood test values.",
      transcriptConfidence: 0.67
    },
    safetyContext: {
      allergies: ["atorvastatin intolerance"],
      currentMedications: ["ramipril"]
    },
    draft: {
      encounter: {
        resourceType: "Encounter",
        id: "encounter-004",
        className: "primary-care",
        reason: "Lipid management review",
        clinicianSummary: "Discussion of cholesterol management after prior medication side effects."
      },
      condition: {
        resourceType: "Condition",
        id: "condition-004",
        codeText: "Hyperlipidaemia",
        clinicalStatus: "active",
        evidence: "Previous statin side effects noted in transcript."
      },
      medicationRequest: {
        resourceType: "MedicationRequest",
        id: "medreq-004",
        medicationText: "Atorvastatin 20mg",
        dosageInstruction: "One tablet nightly",
        reason: "Restart statin after review",
        confidence: 0.61
      },
      observations: [
        {
          resourceType: "Observation",
          id: "obs-005",
          codeText: "LDL cholesterol",
          valueText: "",
          status: "preliminary"
        }
      ]
    },
    auditEvents: [
      { id: "evt-10", category: "system", label: "Input received", actor: "system", timestamp: "18:04" },
      { id: "evt-11", category: "system", label: "Draft generated", actor: "system", timestamp: "18:05" },
      { id: "evt-12", category: "system", label: "Safety checks completed", actor: "system", timestamp: "18:06" }
    ],
    reviewSummary: {},
    fieldChanges: [],
    expectedOutcome: {
      scenarioClass: "lipid follow-up",
      expectedFinalizationState: "blocked",
      expectedSafetyLabels: ["Prior intolerance needs review", "Low-confidence medication extraction"],
      expectedBlockerIncludes: ["high-severity issue"],
      expectedValidationLabels: ["LDL cholesterol value missing"],
      expectedPromotionRecommendation: "hold_in_remediation"
    }
  },
  (() => {
    const acceptedCase: ReviewCase = {
      id: "case-005",
      userId: "demo",
      patientLabel: "Synthetic Patient E",
      status: "accepted",
      updatedAt: "2026-04-22 17:12",
      summary: "Completed eczema follow-up with reviewer-approved structured draft and frozen export artifact.",
      input: {
        sourceType: "note",
        capturedAt: "2026-04-22 16:58",
        summary: "Primary care note confirms stable eczema flare, no infection signs, and repeat topical treatment request.",
        transcriptConfidence: 0.94
      },
      safetyContext: {
        allergies: [],
        currentMedications: ["emollient cream"]
      },
      draft: {
        encounter: {
          resourceType: "Encounter",
          id: "encounter-005",
          className: "primary-care",
          reason: "Eczema follow-up",
          clinicianSummary: "Brief review confirmed stable eczema flare with no systemic concerns."
        },
        condition: {
          resourceType: "Condition",
          id: "condition-005",
          codeText: "Eczema",
          clinicalStatus: "active",
          evidence: "Localized flare only, no cellulitis or secondary infection features."
        },
        medicationRequest: {
          resourceType: "MedicationRequest",
          id: "medreq-005",
          medicationText: "Hydrocortisone 1% cream",
          dosageInstruction: "Apply twice daily for 7 days",
          reason: "Short repeat course for eczema flare",
          confidence: 0.95
        },
        observations: [
          {
            resourceType: "Observation",
            id: "obs-006",
            codeText: "Skin review",
            valueText: "Mild erythema only, no exudate, no fever.",
            status: "final"
          }
        ]
      },
      auditEvents: [
        { id: "evt-13", category: "system", label: "Input received", actor: "system", timestamp: "16:58" },
        { id: "evt-14", category: "system", label: "Draft generated", actor: "system", timestamp: "16:59" },
        { id: "evt-15", category: "reviewer_edit", label: "Edited Encounter", actor: "Dr Lawson", timestamp: "17:06", detail: 'Reason updated from "Repeat medication review" to "Eczema follow-up"' },
        { id: "evt-16", category: "reviewer_note", label: "Reviewer note recorded", actor: "Dr Lawson", timestamp: "17:09", detail: "Draft confirmed against note and skin review findings." },
        { id: "evt-17", category: "reviewer_decision", label: "Draft accepted", actor: "Dr Lawson", timestamp: "17:12" }
      ],
      reviewSummary: {
        lastReviewer: "Dr Lawson",
        lastDecision: "accept",
        lastDecisionAt: "2026-04-22 17:12",
        reviewerNotes: "Draft confirmed against note and skin review findings.",
        overrideReason: ""
      },
      humanGateDecisions: [
        {
          id: "red_flag_escalation",
          status: "not_applicable",
          decidedAt: "2026-04-22 17:10",
          decidedBy: "Dr Lawson",
          note: "No synthetic red-flag escalation evidence in this eczema follow-up."
        },
        {
          id: "referral_pathway",
          status: "not_applicable",
          decidedAt: "2026-04-22 17:10",
          decidedBy: "Dr Lawson",
          note: "Primary-care follow-up remains appropriate in the synthetic scenario."
        },
        {
          id: "medication_decision",
          status: "confirmed",
          decidedAt: "2026-04-22 17:11",
          decidedBy: "Dr Lawson",
          note: "Topical hydrocortisone repeat confirmed against the source note."
        }
      ],
      fieldChanges: [
        {
          id: "chg-accepted-1",
          sectionId: "encounter",
          fieldKey: "reason",
          fieldLabel: "Reason",
          oldValue: "Repeat medication review",
          newValue: "Eczema follow-up",
          actor: "Dr Lawson",
          timestamp: "2026-04-22 17:06"
        }
      ]
    };

    return {
      ...acceptedCase,
      frozenArtifact: createFrozenArtifact(acceptedCase, {
        frozenAt: acceptedCase.reviewSummary?.lastDecisionAt,
        frozenBy: acceptedCase.reviewSummary?.lastReviewer
      })
    };
  })(),
  {
    id: "case-006",
    userId: "demo",
    patientLabel: "Synthetic Patient F",
    status: "pending_review",
    updatedAt: "2026-04-23 09:35",
    summary: "Respiratory escalation scenario with fever, wheeze, and breathlessness requiring explicit clinician confirmation.",
    input: {
      sourceType: "transcript",
      capturedAt: "2026-04-23 09:28",
      summary: "Patient reports cough, fever 38.6 C, wheeze, and shortness of breath overnight. No chest pain reported.",
      transcriptConfidence: 0.74
    },
    safetyContext: {
      allergies: [],
      currentMedications: ["salbutamol inhaler"]
    },
    draft: {
      encounter: {
        resourceType: "Encounter",
        id: "encounter-006",
        className: "primary-care",
        reason: "Acute respiratory complaint",
        clinicianSummary: "Acute respiratory symptoms with fever, wheeze, and breathlessness require escalation review."
      },
      condition: {
        resourceType: "Condition",
        id: "condition-006",
        codeText: "Acute lower respiratory tract symptoms",
        clinicalStatus: "provisional",
        evidence: "Cough, fever, wheeze, and shortness of breath described in source transcript."
      },
      observations: [
        {
          resourceType: "Observation",
          id: "obs-007",
          codeText: "Temperature",
          valueText: "38.6 C",
          status: "preliminary"
        },
        {
          resourceType: "Observation",
          id: "obs-008",
          codeText: "Red flag symptoms",
          valueText: "Wheeze and shortness of breath present; no chest pain reported.",
          status: "preliminary"
        }
      ]
    },
    auditEvents: [
      { id: "evt-18", category: "system", label: "Input received", actor: "system", timestamp: "09:28" },
      { id: "evt-19", category: "system", label: "Draft generated", actor: "system", timestamp: "09:29" },
      { id: "evt-20", category: "system", label: "Safety checks completed", actor: "system", timestamp: "09:30" }
    ],
    reviewSummary: {},
    fieldChanges: [],
    expectedOutcome: {
      scenarioClass: "respiratory escalation",
      expectedFinalizationState: "blocked",
      expectedSafetyLabels: ["Respiratory escalation review needed"],
      expectedBlockerIncludes: ["high-severity issue"],
      expectedPromotionRecommendation: "hold_in_remediation"
    }
  },
  {
    id: "case-007",
    userId: "demo",
    patientLabel: "Synthetic Patient G",
    status: "pending_review",
    updatedAt: "2026-04-23 10:15",
    summary: "Conflicting respiratory source evidence where the source denies fever but the draft observation records fever.",
    input: {
      sourceType: "note",
      capturedAt: "2026-04-23 10:08",
      summary: "Cough review. Patient states no fever and no shortness of breath. Draft still needs confirmation against observations.",
      transcriptConfidence: 0.9
    },
    safetyContext: {
      allergies: [],
      currentMedications: []
    },
    draft: {
      encounter: {
        resourceType: "Encounter",
        id: "encounter-007",
        className: "primary-care",
        reason: "Acute respiratory complaint",
        clinicianSummary: "Cough review with source/draft mismatch requiring reviewer confirmation."
      },
      condition: {
        resourceType: "Condition",
        id: "condition-007",
        codeText: "Viral upper respiratory infection",
        clinicalStatus: "provisional",
        evidence: "Source note denies fever, but structured temperature field suggests fever."
      },
      observations: [
        {
          resourceType: "Observation",
          id: "obs-009",
          codeText: "Temperature",
          valueText: "Fever reported by patient",
          status: "preliminary"
        },
        {
          resourceType: "Observation",
          id: "obs-010",
          codeText: "Red flag symptoms",
          valueText: "No breathlessness reported.",
          status: "preliminary"
        }
      ]
    },
    auditEvents: [
      { id: "evt-21", category: "system", label: "Input received", actor: "system", timestamp: "10:08" },
      { id: "evt-22", category: "system", label: "Draft generated", actor: "system", timestamp: "10:09" },
      { id: "evt-23", category: "system", label: "Safety checks completed", actor: "system", timestamp: "10:10" }
    ],
    reviewSummary: {},
    fieldChanges: [],
    expectedOutcome: {
      scenarioClass: "conflicting evidence",
      expectedFinalizationState: "warn",
      expectedSafetyLabels: ["Conflicting source evidence"],
      expectedPromotionRecommendation: "ready_for_pilot_prep"
    }
  },
  {
    id: "case-008",
    userId: "demo",
    patientLabel: "Synthetic Patient H",
    status: "pending_review",
    updatedAt: "2026-04-23 11:05",
    summary: "Medication dosing ambiguity scenario with a drafted antibiotic but missing dosage instruction.",
    input: {
      sourceType: "note",
      capturedAt: "2026-04-23 10:58",
      summary: "Sinus symptoms discussed. Doxycycline mentioned as a possible option but dose and duration are not documented.",
      transcriptConfidence: 0.83
    },
    safetyContext: {
      allergies: [],
      currentMedications: []
    },
    draft: {
      encounter: {
        resourceType: "Encounter",
        id: "encounter-008",
        className: "primary-care",
        reason: "Medication option review",
        clinicianSummary: "Antibiotic option discussed, but dosing details are absent from the source note."
      },
      condition: {
        resourceType: "Condition",
        id: "condition-008",
        codeText: "Sinus symptoms",
        clinicalStatus: "provisional",
        evidence: "Doxycycline mentioned as possible treatment without documented dose or duration."
      },
      medicationRequest: {
        resourceType: "MedicationRequest",
        id: "medreq-008",
        medicationText: "Doxycycline",
        dosageInstruction: "",
        reason: "Possible treatment option mentioned in source note",
        confidence: 0.66
      },
      observations: [
        {
          resourceType: "Observation",
          id: "obs-011",
          codeText: "Medication plan completeness",
          valueText: "Dose and duration not documented.",
          status: "preliminary"
        }
      ]
    },
    auditEvents: [
      { id: "evt-24", category: "system", label: "Input received", actor: "system", timestamp: "10:58" },
      { id: "evt-25", category: "system", label: "Draft generated", actor: "system", timestamp: "10:59" },
      { id: "evt-26", category: "system", label: "Safety checks completed", actor: "system", timestamp: "11:00" }
    ],
    reviewSummary: {},
    fieldChanges: [],
    expectedOutcome: {
      scenarioClass: "medication dosing ambiguity",
      expectedFinalizationState: "warn",
      expectedSafetyLabels: ["Low-confidence medication extraction"],
      expectedValidationLabels: ["Medication dosage missing"],
      expectedPromotionRecommendation: "complete_reviewer_validation"
    }
  },
  {
    "id": "case-v-uk1",
    "userId": "demo",
    "scenarioId": "V-UK1",
    "patientLabel": "Margaret T.: T2D + DVT",
    "status": "pending_review",
    "updatedAt": "2026-07-10 14:30",
    "summary": "Golden scenario V-UK1: T2D with poor glycaemic control, suspected DVT, aspirin + proposed apixaban: all agent outputs staged as DRAFT.",
    "input": {
      "sourceType": "transcript",
      "sourceProfile": "voice_note_intake",
      "capturedAt": "2026-07-10 14:15",
      "summary": "Patient reports worsening left leg swelling and discomfort over five days. Type 2 diabetes: last HbA1c 58 mmol/mol. Currently on metformin and aspirin 75mg. GP considering apixaban for suspected DVT after Wells score discussion.",
      "transcriptConfidence": 0.91
    },
    "safetyContext": {
      "allergies": [],
      "currentMedications": [
        "Metformin 1g twice daily",
        "Aspirin 75mg daily"
      ]
    },
    "oracleRiskScore": {
      "baseline": 78,
      "current": 82,
      "factors": [
        "Type 2 diabetes mellitus with hyperglycaemia (HbA1c 58 mmol/mol)",
        "Suspected deep vein thrombosis: left leg swelling",
        "Antiplatelet therapy (Aspirin) with proposed anticoagulation",
        "Poor glycaemic control increases vascular risk"
      ]
    },
    "draft": {
      "encounter": {
        "resourceType": "Encounter",
        "id": "encounter-vuk1",
        "className": "primary-care",
        "reason": "Leg swelling with T2D review",
        "clinicianSummary": "58-year-old with T2D (HbA1c 58 mmol/mol) presents with five-day left calf swelling and tightness. Wells criteria suggest moderate DVT probability. Poor glycaemic control noted. Anticoagulation discussed pending imaging."
      },
      "condition": {
        "resourceType": "Condition",
        "id": "condition-vuk1-dvt",
        "codeText": "Suspected deep vein thrombosis: left leg",
        "clinicalStatus": "provisional",
        "evidence": "Unilateral calf swelling, discomfort on walking, prior leg swelling history."
      },
      "medicationRequest": {
        "resourceType": "MedicationRequest",
        "id": "medreq-vuk1",
        "medicationText": "Apixaban 5mg twice daily",
        "dosageInstruction": "5mg twice daily pending confirmatory imaging",
        "reason": "Proposed anticoagulation for suspected DVT: requires GUARDIAN review with aspirin",
        "confidence": 0.94
      },
      "observations": [
        {
          "resourceType": "Observation",
          "id": "obs-vuk1-hba1c",
          "codeText": "HbA1c",
          "valueText": "58 mmol/mol (poor glycaemic control)",
          "status": "final"
        },
        {
          "resourceType": "Observation",
          "id": "obs-vuk1-leg",
          "codeText": "Leg swelling",
          "valueText": "Left calf swelling × 5 days, prior history noted",
          "status": "preliminary"
        },
        {
          "resourceType": "Observation",
          "id": "obs-vuk1-wells",
          "codeText": "Wells DVT score",
          "valueText": "Moderate probability: imaging advised",
          "status": "preliminary"
        }
      ]
    },
    "reviewQueueItems": [
      {
        "id": "case-v-uk1-queue-voice",
        "agentId": "VOICE",
        "itemType": "voice_transcript",
        "status": "DRAFT",
        "title": "Voice intake transcript",
        "summary": "VOICE captured consultation: leg swelling, T2D, HbA1c 58, metformin + aspirin, apixaban discussed.",
        "content": "Patient reports worsening left leg swelling and discomfort over five days. Type 2 diabetes: last HbA1c 58 mmol/mol. Currently on metformin and aspirin 75mg. GP considering apixaban for suspected DVT after Wells score discussion.",
        "metadata": {
          "sourceType": "transcript",
          "confidence": 91
        }
      },
      {
        "id": "case-v-uk1-queue-soap",
        "agentId": "SYNTHESIS",
        "itemType": "soap_note",
        "status": "DRAFT",
        "title": "SOAP note draft",
        "summary": "SYNTHESIS: DVT suspicion with poor glycaemic control in T2D patient.",
        "content": "Subjective: Five-day left calf swelling and tightness. T2D: HbA1c 58 mmol/mol. On metformin and aspirin 75mg.\nObjective: Left calf swelling. HbA1c 58 mmol/mol. Wells score moderate.\nAssessment: Suspected DVT (left). T2D (SNOMED CT 44054006). Poor glycaemic control.\nPlan: Urgent DVT imaging. Consider apixaban if confirmed: GUARDIAN review required (aspirin interaction). Diabetes optimisation.",
        "metadata": {
          "encounterReason": "Leg swelling with T2D review",
          "condition": "Suspected deep vein thrombosis: left leg"
        }
      },
      {
        "id": "case-v-uk1-queue-codes",
        "agentId": "DrASSIST",
        "itemType": "diagnosis_codes",
        "status": "DRAFT",
        "title": "Diagnosis code suggestions",
        "summary": "SNOMED CT 128053003 · 44054006 (ICD-10 I80.2 · E11.9): confidence 94%",
        "content": "SNOMED CT 128053003 | Deep venous thrombosis (ICD-10 I80.2)\nSNOMED CT 44054006 | Type 2 diabetes mellitus (ICD-10 E11.9)",
        "metadata": {
          "icdCodes": [
            "SNOMED CT 128053003 | Deep venous thrombosis (ICD-10 I80.2)",
            "SNOMED CT 44054006 | Type 2 diabetes mellitus (ICD-10 E11.9)"
          ],
          "confidence": 94
        }
      },
      {
        "id": "case-v-uk1-queue-guardian",
        "agentId": "GUARDIAN",
        "itemType": "guardian_alert",
        "status": "DRAFT",
        "title": "Anticoagulant + antiplatelet interaction",
        "summary": "GUARDIAN HIGH: Aspirin 75mg + proposed Apixaban: major bleeding risk.",
        "content": "GUARDIAN HIGH ALERT\nCurrent: Aspirin 75mg daily\nProposed: Apixaban 5mg twice daily\nRisk: Major bleeding: dual antithrombotic therapy\nAction: GP must Accept / Edit / Reject before any write-back.",
        "metadata": {
          "severity": "high",
          "flagCount": 1
        }
      },
      {
        "id": "case-v-uk1-queue-oracle",
        "agentId": "ORACLE",
        "itemType": "oracle_update",
        "status": "DRAFT",
        "title": "Risk score update",
        "summary": "HORIZON: CVD/T2D composite risk 78 → 82 after DVT flag",
        "content": "Type 2 diabetes mellitus with hyperglycaemia (HbA1c 58 mmol/mol)\nSuspected deep vein thrombosis: left leg swelling\nAntiplatelet therapy (Aspirin) with proposed anticoagulation\nPoor glycaemic control increases vascular risk",
        "metadata": {
          "baseline": 78,
          "current": 82,
          "delta": 4
        }
      }
    ],
    "auditEvents": [
      {
        "id": "evt-vuk1-1",
        "category": "system",
        "label": "VOICE: transcript received",
        "actor": "system",
        "timestamp": "14:15"
      },
      {
        "id": "evt-vuk1-2",
        "category": "system",
        "label": "SYNTHESIS: SOAP draft staged",
        "actor": "system",
        "timestamp": "14:16"
      },
      {
        "id": "evt-vuk1-3",
        "category": "system",
        "label": "Dr.Assist: codes suggested",
        "actor": "system",
        "timestamp": "14:16"
      },
      {
        "id": "evt-vuk1-4",
        "category": "system",
        "label": "GUARDIAN: HIGH alert raised",
        "actor": "system",
        "timestamp": "14:17"
      },
      {
        "id": "evt-vuk1-5",
        "category": "system",
        "label": "HORIZON: risk score updated",
        "actor": "system",
        "timestamp": "14:17"
      }
    ],
    "reviewSummary": {},
    "fieldChanges": [],
    "expectedOutcome": {
      "scenarioClass": "V-UK1 T2D + DVT golden scenario",
      "expectedFinalizationState": "blocked",
      "expectedSafetyLabels": [
        "Anticoagulant + antiplatelet interaction"
      ],
      "expectedPromotionRecommendation": "hold_in_remediation"
    }
  }
];

export * from "./mock-data/index";
