import type { ReviewQueueItem } from "./types";

export const reviewQueueItems: ReviewQueueItem[] = [
  {
    id: "RQ001",
    patientId: "P002",
    patientName: "Mr James Patel",
    patientNhsNumber: "482 193 7654",
    agentType: "SYNTHESIS",
    title: "SOAP note | T2D + DVT consultation",
    content: `S: Mr Patel, 54, presents for follow-up of newly diagnosed right popliteal DVT and poorly controlled T2D. Reports mild calf discomfort, no chest pain or breathlessness. Adherent to Metformin. Concerned about starting anticoagulation alongside aspirin.

O: BP 138/86, HR 78 regular. Right calf mildly tender, no erythema. HbA1c 68 mmol/mol (last done 12 months ago). Weight stable. No signs of heart failure.

A: 1) Deep vein thrombosis right popliteal vein: newly diagnosed, requires anticoagulation. 2) Type 2 diabetes mellitus with hyperglycaemia | suboptimal control, review overdue. 3) Drug interaction risk: aspirin + proposed apixaban.

P: Discuss GUARDIAN alert re aspirin/apixaban. Arrange urgent medication review. Repeat HbA1c and renal function. 2-week follow-up. Patient education on DVT warning signs. Consider diabetes nurse referral.`,
    confidenceScore: 91,
    evidenceSources: [
      { resourceType: "Encounter", resourceId: "enc-p002-20260710", summary: "Today's GP consultation" },
      { resourceType: "Condition", resourceId: "cond-dvt-p002", summary: "DVT diagnosis 3 days ago" },
      { resourceType: "Observation", resourceId: "obs-hba1c-p002", summary: "HbA1c 68 mmol/mol" },
    ],
    createdAt: "2026-07-10T09:35:00Z",
    priority: "High",
    status: "Pending",
    editedContent: null,
    rejectionReason: null,
    auditEventId: null,
  },
  {
    id: "RQ002",
    patientId: "P002",
    patientName: "Mr James Patel",
    patientNhsNumber: "482 193 7654",
    agentType: "DrASSIST",
    title: "Clinical coding | DVT + T2D poor control",
    content:
      "Proposed clinical codes: [1] I82.4: Deep vein thrombosis of right popliteal vein (94% confidence) [2] E11.65: Type 2 diabetes mellitus with hyperglycaemia (97% confidence)",
    confidenceScore: 94,
    evidenceSources: [
      { resourceType: "Condition", resourceId: "cond-dvt-p002", summary: "Ultrasound-confirmed DVT" },
      { resourceType: "Observation", resourceId: "obs-hba1c-p002", summary: "HbA1c above target" },
    ],
    createdAt: "2026-07-10T09:36:00Z",
    priority: "High",
    status: "Pending",
    editedContent: null,
    rejectionReason: null,
    auditEventId: null,
  },
  {
    id: "RQ003",
    patientId: "P002",
    patientName: "Mr James Patel",
    patientNhsNumber: "482 193 7654",
    agentType: "GUARDIAN",
    title: "Drug interaction | Aspirin + Apixaban",
    content:
      "🔴 HIGH RISK: Aspirin 75mg (current) and Apixaban 10mg (proposed) share additive bleeding risk. BNF section 2.9. Recommend: review Aspirin indication before co-prescribing anticoagulant. If co-prescribing necessary, consider gastroprotection.",
    confidenceScore: null,
    evidenceSources: [
      { resourceType: "MedicationStatement", resourceId: "med-aspirin-p002", summary: "Aspirin 75mg current" },
      { resourceType: "MedicationRequest", resourceId: "med-apixaban-p002", summary: "Apixaban 10mg proposed" },
    ],
    createdAt: "2026-07-10T09:37:00Z",
    priority: "Urgent",
    status: "Pending",
    editedContent: null,
    rejectionReason: null,
    auditEventId: null,
  },
  {
    id: "RQ004",
    patientId: "P002",
    patientName: "Mr James Patel",
    patientNhsNumber: "482 193 7654",
    agentType: "ORACLE",
    title: "Risk score update after DVT",
    content:
      "Risk score updated from 78 → 82 (Very High). Primary contributors: (1) New DVT diagnosis with T2D combination (+8 points), (2) Proposed anticoagulant + Aspirin combination risk (+4 points), (3) Missed HbA1c review 12 months (+2 points). Recommended: urgent medication review, 2-week follow-up.",
    confidenceScore: 82,
    evidenceSources: [
      { resourceType: "RiskAssessment", resourceId: "oracle-p002", summary: "ORACLE composite risk model" },
    ],
    createdAt: "2026-07-10T09:38:00Z",
    priority: "High",
    status: "Pending",
    editedContent: null,
    rejectionReason: null,
    auditEventId: null,
  },
  {
    id: "RQ005",
    patientId: "P001",
    patientName: "Mrs Sarah Johnson",
    patientNhsNumber: "943 476 5820",
    agentType: "VOICE",
    title: "Voice Care Agent | Day 3 post-discharge SOAP",
    content: `Voice Care Agent call: Day 3 post-discharge. SOAP:
S: Patient reports increased breathlessness over last 24h. Ankle swelling worsening bilaterally. Weight gain 2.3kg since discharge (now 78.2kg).
O: [Phone assessment: no vitals available]
A: High risk of heart failure decompensation / readmission.
P: URGENT | escalate to on-call nurse for same-day review. Continue Furosemide 40mg. Reduce fluid intake to <1.5L/day.`,
    confidenceScore: 88,
    evidenceSources: [
      { resourceType: "Communication", resourceId: "voice-p001-20260710", summary: "Voice Care Agent call transcript" },
      { resourceType: "Encounter", resourceId: "enc-p001-discharge", summary: "Discharge 3 days ago" },
    ],
    createdAt: "2026-07-10T08:12:00Z",
    priority: "Urgent",
    status: "Pending",
    editedContent: null,
    rejectionReason: null,
    auditEventId: null,
  },
  {
    id: "RQ006",
    patientId: "P004",
    patientName: "Mr Daniel Chen",
    patientNhsNumber: "673 204 8912",
    agentType: "DrASSIST",
    title: "Hypertension + CKD coding update",
    content: "Proposed: I10: Essential hypertension (99%), N18.3: CKD Stage 3 (98%)",
    confidenceScore: 98,
    evidenceSources: [
      { resourceType: "Condition", resourceId: "cond-htn-p004", summary: "Persistent hypertension" },
      { resourceType: "Observation", resourceId: "obs-egfr-p004", summary: "eGFR 52: CKD Stage 3" },
    ],
    createdAt: "2026-07-08T11:05:00Z",
    priority: "Normal",
    status: "Pending",
    editedContent: null,
    rejectionReason: null,
    auditEventId: null,
  },
  {
    id: "RQ007",
    patientId: "P008",
    patientName: "Mr Thomas Green",
    patientNhsNumber: "947 123 5680",
    agentType: "GUARDIAN",
    title: "Polypharmacy alert | 9 medications, 3 interactions",
    content:
      "🔴 Polypharmacy alert: 9 active medications. Identified interactions: [1] Warfarin + Ibuprofen (PRN): HIGH: bleeding risk. [2] ACE inhibitor + Potassium supplement: MEDIUM: hyperkalaemia risk. [3] Amitriptyline + Tramadol: MEDIUM: serotonin syndrome risk. Recommend comprehensive medication review.",
    confidenceScore: null,
    evidenceSources: [
      { resourceType: "MedicationStatement", resourceId: "med-list-p008", summary: "9 active medications" },
    ],
    createdAt: "2026-07-01T15:10:00Z",
    priority: "Urgent",
    status: "Pending",
    editedContent: null,
    rejectionReason: null,
    auditEventId: null,
  },
  {
    id: "RQ008",
    patientId: "P003",
    patientName: "Mrs Margaret Williams",
    patientNhsNumber: "291 847 3056",
    agentType: "SYNTHESIS",
    title: "Multimorbidity summary | COPD + HF + Frailty",
    content: `S: Mrs Williams, 78, frail, with COPD, heart failure and progressive breathlessness. Carer reports increased fatigue and reduced mobility. Using salbutamol more frequently. Some confusion about medication timing.

O: Last SpO2 92% (home reading). Weight up 1.8kg. Using 3-4 salbutamol doses daily (baseline 1-2). No fever. Mild peripheral oedema.

A: 1) COPD: possible exacerbation / decompensation. 2) Heart failure: fluid overload likely contributing. 3) Frailty: medication non-adherence and functional decline. 4) High 14-day admission risk (73%).

P: Urgent community nurse review. Reinforce Furosemide adherence. Consider oral steroids if COPD exacerbation confirmed. MDT frailty review. Carer support assessment. Safety netting | when to call 999.`,
    confidenceScore: 87,
    evidenceSources: [
      { resourceType: "Encounter", resourceId: "enc-p003-20260703", summary: "Last GP review" },
      { resourceType: "Observation", resourceId: "obs-spo2-p003", summary: "SpO2 trend declining" },
    ],
    createdAt: "2026-07-09T14:30:00Z",
    priority: "High",
    status: "Pending",
    editedContent: null,
    rejectionReason: null,
    auditEventId: null,
  },
  {
    id: "RQ009",
    patientId: "P006",
    patientName: "Mr William Brown",
    patientNhsNumber: "834 561 2097",
    agentType: "REFERRAL",
    title: "Oncology urgent referral package",
    content:
      "Referral package generated: Oncology follow-up (2-week wait). Included: latest PSA results, recent CT scan summary, current medication list, performance status (ECOG 1). Missing: bone scan (pending). Predicted urgency: HIGH. Estimated wait at Leeds Teaching Hospitals: 9 days. Alternative pathway via Private Provider: 3 days.",
    confidenceScore: 79,
    evidenceSources: [
      { resourceType: "DiagnosticReport", resourceId: "psa-p006", summary: "Latest PSA 18.4 ng/mL" },
      { resourceType: "ImagingStudy", resourceId: "ct-p006", summary: "CT pelvis: progressive disease" },
    ],
    createdAt: "2026-07-05T12:20:00Z",
    priority: "Urgent",
    status: "Pending",
    editedContent: null,
    rejectionReason: null,
    auditEventId: null,
  },
  {
    id: "RQ010",
    patientId: "P003",
    patientName: "Mrs Margaret Williams",
    patientNhsNumber: "291 847 3056",
    agentType: "ORACLE",
    title: "14-day admission risk forecast",
    content:
      "14-day admission risk: 73%. Deterioration signals detected: (1) SpO2 trending down: 96% → 94% → 92% over 3 weeks, (2) Weight gain 1.8kg (fluid retention indicator), (3) Missed Furosemide doses last 5 days (pharmacy adherence data). Digital Twin prediction: heart failure decompensation likely within 7-14 days without intervention.",
    confidenceScore: 73,
    evidenceSources: [
      { resourceType: "RiskAssessment", resourceId: "oracle-p003", summary: "ORACLE admission model" },
      { resourceType: "Observation", resourceId: "obs-weight-p003", summary: "Weight trend" },
    ],
    createdAt: "2026-07-09T14:35:00Z",
    priority: "Urgent",
    status: "Pending",
    editedContent: null,
    rejectionReason: null,
    auditEventId: null,
  },
];
