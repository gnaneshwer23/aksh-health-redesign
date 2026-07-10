export type OracleRisk = "Low" | "Medium" | "High" | "VeryHigh";

export type AgentType =
  | "SYNTHESIS"
  | "DrASSIST"
  | "GUARDIAN"
  | "ORACLE"
  | "VOICE"
  | "REFERRAL"
  | "EQUITY"
  | "SHIELD"
  | "HEALTH_COMPANION"
  | "COMMAND";

export type ReviewPriority = "Normal" | "High" | "Urgent";

export type ReviewStatus = "Pending" | "Accepted" | "Edited" | "Rejected";

export type PathwayStepStatus = "Completed" | "InProgress" | "Pending" | "AwaitingApproval";

export type PathwayAutomation = "FullyAutomated" | "SupervisedAutomation" | "Manual";

export type WardStatus = "Normal" | "Pressured" | "Critical";

export interface Patient {
  id: string;
  name: string;
  nhsNumber: string;
  dob: string;
  age: number;
  gender: string;
  postcode: string;
  oracleScore: number;
  oracleRisk: OracleRisk;
  activeConditions: string[];
  activeMedications: string[];
  allergies: string[];
  lastEncounterDate: string;
  nextAppointmentDate?: string;
  openAiItems: number;
  carePathways: string[];
  digitalTwinPrediction: {
    admissionRisk14Days: number;
    deteriorationSignals: string[];
    recommendedActions: string[];
  };
  flags: string[];
  appointmentTime?: string;
  supervisingGp?: string;
  room?: string;
  lastObsTime?: string;
  equityFlag?: boolean;
}

export interface EvidenceSource {
  resourceType: string;
  resourceId: string;
  summary: string;
}

export interface ReviewQueueItem {
  id: string;
  patientId: string;
  patientName: string;
  patientNhsNumber: string;
  agentType: AgentType;
  title: string;
  content: string;
  confidenceScore: number | null;
  evidenceSources: EvidenceSource[];
  createdAt: string;
  priority: ReviewPriority;
  status: ReviewStatus;
  editedContent: string | null;
  rejectionReason: string | null;
  auditEventId: string | null;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
}

export interface CarePathwayStep {
  stepNumber: number;
  title: string;
  description: string;
  status: PathwayStepStatus;
  dueDate: string;
  completedDate: string | null;
  aiGenerated: boolean;
  requiresApproval: boolean;
}

export interface CarePathway {
  id: string;
  name: string;
  triggerCondition: string;
  currentPatients: string[];
  steps: CarePathwayStep[];
  automationLevel: PathwayAutomation;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  agent: AgentType | "System" | "Nurse" | "Admin" | "Patient";
  action: string;
  resource: string;
}

export interface DrugInteraction {
  drugA: string;
  drugB: string;
  severity: "High" | "Medium" | "Low";
  bnfSection: string;
  recommendation: string;
}

export interface Medication {
  name: string;
  genericName: string;
  bnfSection: string;
  dosing: string;
  interactions: DrugInteraction[];
}

export interface Ward {
  name: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  status: WardStatus;
  staffRatio?: string;
  averageLos?: number;
  awaitingDischarge?: number;
}

export interface CapacityForecastDay {
  day: string;
  predictedAdmissions: number;
  predictedDischarges: number;
  netBedDemand: number;
}

export interface HospitalData {
  hospitalName: string;
  wards: Ward[];
  edWaitingTime: number;
  edPatientsWaiting: number;
  staffingAlerts: string[];
  capacityForecast: CapacityForecastDay[];
  aiRecommendations: { id: string; text: string; urgency: ReviewPriority }[];
  theatresRunning: number;
  theatresTotal: number;
  agencyTriggers: { ward: string; message: string }[];
}

export interface PopulationData {
  icsName: string;
  totalPatients: number;
  practices: number;
  aiActionsThisMonth: number;
  synthesisApprovalRate: number;
  guardianAlertsGenerated: number;
  conditionPrevalenceByIMD: {
    quintile: string;
    t2d: number;
    hypertension: number;
    copd: number;
    depression: number;
  }[];
  riskDistribution: { low: number; medium: number; high: number; veryHigh: number };
  equityFlags: number;
  benchmarkByPractice: {
    name: string;
    listSize: number;
    aiAdoption: number;
    queueClearance: number;
    guardianAlerts: number;
    equityFlags: number;
    overallScore: number;
  }[];
  admissionForecast: {
    day: string;
    predicted: number;
    historical: number;
    upper: number;
    lower: number;
  }[];
  equityDeepDive: {
    category: string;
    flagCount: number;
    practice: string;
    recommendedAction: string;
    status: string;
  }[];
}

export interface AdminUser {
  id: string;
  name: string;
  role: string;
  email: string;
  status: "Active" | "Invited" | "Deactivated";
  lastActive: string;
  mfa: boolean;
}

export interface IntegrationService {
  name: string;
  status: "Healthy" | "Degraded" | "Down";
  lastSync: string;
  latencyMs: number;
}
