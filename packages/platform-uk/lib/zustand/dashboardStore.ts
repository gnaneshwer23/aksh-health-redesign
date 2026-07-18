import { create } from "zustand";

import { auditEvents as initialAuditEvents } from "@/lib/mock-data/audit-events";
import { reviewQueueItems as initialReviewQueue } from "@/lib/mock-data/review-queue";
import type { AdminUser, AgentType, AuditEvent, ReviewQueueItem } from "@/lib/mock-data/types";

export type DashboardRole = "gp" | "nurse" | "pharmacist" | "admin" | "ics" | "hospital" | "patient" | "researcher";

export type NurseFilter = "all" | "alerts" | "observations" | "completed";

export type IcsDateRange = "30d" | "90d" | "12m";

interface DashboardState {
  selectedPatientId: string | null;
  reviewQueueItems: ReviewQueueItem[];
  auditEvents: AuditEvent[];
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  nurseFilter: NurseFilter;
  icsDateRange: IcsDateRange;
  icsSortColumn: string;
  icsSortAsc: boolean;
  adminUsers: AdminUser[];
  dismissedHospitalAlerts: string[];
  dismissedAgencyAlerts: string[];
  acceptedHospitalRecs: string[];
  dismissedHospitalRecs: string[];
  medicationReviewsCompleted: string[];
  notificationCount: number;
  writtenToRecordToday: ReviewQueueItem[];

  setSelectedPatient: (id: string | null) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setNurseFilter: (filter: NurseFilter) => void;
  setIcsDateRange: (range: IcsDateRange) => void;
  setIcsSort: (column: string) => void;

  acceptReviewItem: (id: string, reviewerName: string) => void;
  rejectReviewItem: (id: string, reason: string, reviewerName: string) => void;
  editReviewItem: (id: string, content: string, reviewerName: string) => void;

  addAuditEvent: (event: Omit<AuditEvent, "id" | "timestamp">) => void;
  inviteUser: (user: Omit<AdminUser, "id" | "lastActive">) => void;
  updateUserStatus: (id: string, status: AdminUser["status"]) => void;
  dismissHospitalAlert: (id: string) => void;
  dismissAgencyAlert: (ward: string) => void;
  acceptHospitalRec: (id: string, reviewerName: string) => void;
  dismissHospitalRec: (id: string, reviewerName: string) => void;
  stageGuardianInteraction: (payload: {
    patientId: string;
    patientName: string;
    patientNhsNumber: string;
    title: string;
    content: string;
  }) => void;
  stageVoiceTranscript: (payload: {
    patientId: string;
    patientName: string;
    patientNhsNumber: string;
    transcript: string;
    reviewerName: string;
  }) => void;
  stageAgentDraft: (payload: {
    patientId: string;
    patientName: string;
    patientNhsNumber: string;
    agentType: AgentType;
    title: string;
    content: string;
    confidenceScore?: number | null;
    priority?: "High" | "Normal" | "Urgent";
    reviewerName: string;
  }) => void;
  markMedicationReviewed: (patientId: string) => void;
}

function createAuditEvent(partial: Omit<AuditEvent, "id" | "timestamp">): AuditEvent {
  return {
    ...partial,
    id: `AE${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  selectedPatientId: "P002",
  reviewQueueItems: initialReviewQueue.map((item) => ({ ...item })),
  auditEvents: [...initialAuditEvents],
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  nurseFilter: "all",
  icsDateRange: "30d",
  icsSortColumn: "overallScore",
  icsSortAsc: false,
  adminUsers: [],
  dismissedHospitalAlerts: [],
  dismissedAgencyAlerts: [],
  acceptedHospitalRecs: [],
  dismissedHospitalRecs: [],
  medicationReviewsCompleted: [],
  notificationCount: 7,
  writtenToRecordToday: [],

  setSelectedPatient: (id) => set({ selectedPatientId: id }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  setNurseFilter: (filter) => set({ nurseFilter: filter }),
  setIcsDateRange: (range) => set({ icsDateRange: range }),
  setIcsSort: (column) =>
    set((s) => ({
      icsSortColumn: column,
      icsSortAsc: s.icsSortColumn === column ? !s.icsSortAsc : false,
    })),

  acceptReviewItem: (id, reviewerName) => {
    const now = new Date().toISOString();
    set((s) => {
      const items = s.reviewQueueItems.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Accepted" as const,
              acceptedAt: now,
              acceptedBy: reviewerName,
              auditEventId: `AE${Date.now()}`,
            }
          : item
      );
      const accepted = items.find((i) => i.id === id);
      const event = createAuditEvent({
        user: reviewerName,
        agent: accepted?.agentType ?? "SYNTHESIS",
        action: "Accepted AI output",
        resource: `${id} / ${accepted?.patientName ?? "unknown"}`,
      });
      return {
        reviewQueueItems: items,
        writtenToRecordToday: accepted ? [...s.writtenToRecordToday, accepted] : s.writtenToRecordToday,
        auditEvents: [event, ...s.auditEvents],
      };
    });
  },

  rejectReviewItem: (id, reason, reviewerName) => {
    set((s) => {
      const items = s.reviewQueueItems.map((item) =>
        item.id === id ? { ...item, status: "Rejected" as const, rejectionReason: reason } : item
      );
      const rejected = items.find((i) => i.id === id);
      const event = createAuditEvent({
        user: reviewerName,
        agent: rejected?.agentType ?? "SYNTHESIS",
        action: `Rejected | ${reason}`,
        resource: `${id} / ${rejected?.patientName ?? "unknown"}`,
      });
      return { reviewQueueItems: items, auditEvents: [event, ...s.auditEvents] };
    });
  },

  editReviewItem: (id, content, reviewerName) => {
    set((s) => {
      const items = s.reviewQueueItems.map((item) =>
        item.id === id
          ? { ...item, status: "Edited" as const, editedContent: content, content }
          : item
      );
      const event = createAuditEvent({
        user: reviewerName,
        agent: items.find((i) => i.id === id)?.agentType ?? "SYNTHESIS",
        action: "Edited AI output | pending re-acceptance",
        resource: id,
      });
      return { reviewQueueItems: items, auditEvents: [event, ...s.auditEvents] };
    });
  },

  addAuditEvent: (partial) => {
    set((s) => ({ auditEvents: [createAuditEvent(partial), ...s.auditEvents] }));
  },

  inviteUser: (user) => {
    set((s) => ({
      adminUsers: [
        ...s.adminUsers,
        { ...user, id: `U${Date.now()}`, lastActive: "Not set" },
      ],
    }));
    get().addAuditEvent({
      user: "Admin Singh",
      agent: "Admin",
      action: "Invited user",
      resource: `${user.email} | ${user.role}`,
    });
  },

  updateUserStatus: (id, status) => set((s) => ({
    adminUsers: s.adminUsers.map((u) => (u.id === id ? { ...u, status } : u)),
  })),

  dismissHospitalAlert: (id) =>
    set((s) => ({ dismissedHospitalAlerts: [...s.dismissedHospitalAlerts, id] })),

  dismissAgencyAlert: (ward) =>
    set((s) => ({ dismissedAgencyAlerts: [...s.dismissedAgencyAlerts, ward] })),

  acceptHospitalRec: (id, reviewerName) => {
    get().addAuditEvent({
      user: reviewerName,
      agent: "COMMAND",
      action: "Accepted AI recommendation",
      resource: id,
    });
    set((s) => ({ acceptedHospitalRecs: [...s.acceptedHospitalRecs, id] }));
  },

  dismissHospitalRec: (id, reviewerName) => {
    get().addAuditEvent({
      user: reviewerName,
      agent: "COMMAND",
      action: "Dismissed AI recommendation",
      resource: id,
    });
    set((s) => ({ dismissedHospitalRecs: [...s.dismissedHospitalRecs, id] }));
  },

  stageGuardianInteraction: (payload) => {
    const id = `RQ${Date.now()}`;
    const item: ReviewQueueItem = {
      id,
      patientId: payload.patientId,
      patientName: payload.patientName,
      patientNhsNumber: payload.patientNhsNumber,
      agentType: "GUARDIAN",
      title: payload.title,
      content: payload.content,
      confidenceScore: null,
      evidenceSources: [],
      createdAt: new Date().toISOString(),
      priority: "High",
      status: "Pending",
      editedContent: null,
      rejectionReason: null,
      auditEventId: null,
    };
    set((s) => ({ reviewQueueItems: [item, ...s.reviewQueueItems] }));
    get().addAuditEvent({
      user: "Pharmacist Lee",
      agent: "GUARDIAN",
      action: "Staged interaction check for review",
      resource: `${id} / ${payload.patientName}`,
    });
  },

  stageVoiceTranscript: (payload) => {
    const id = `RQ${Date.now()}`;
    const item: ReviewQueueItem = {
      id,
      patientId: payload.patientId,
      patientName: payload.patientName,
      patientNhsNumber: payload.patientNhsNumber,
      agentType: "VOICE",
      title: "Consultation transcript",
      content: payload.transcript,
      confidenceScore: null,
      evidenceSources: [],
      createdAt: new Date().toISOString(),
      priority: "Normal",
      status: "Pending",
      editedContent: null,
      rejectionReason: null,
      auditEventId: null,
    };
    set((s) => ({ reviewQueueItems: [item, ...s.reviewQueueItems] }));
    get().addAuditEvent({
      user: payload.reviewerName,
      agent: "VOICE",
      action: "Staged consultation transcript for review",
      resource: `${id} / ${payload.patientName}`,
    });
  },

  stageAgentDraft: (payload) => {
    const id = `RQ${Date.now()}`;
    const item: ReviewQueueItem = {
      id,
      patientId: payload.patientId,
      patientName: payload.patientName,
      patientNhsNumber: payload.patientNhsNumber,
      agentType: payload.agentType,
      title: payload.title,
      content: payload.content,
      confidenceScore: payload.confidenceScore ?? null,
      evidenceSources: [],
      createdAt: new Date().toISOString(),
      priority: payload.priority ?? "Normal",
      status: "Pending",
      editedContent: null,
      rejectionReason: null,
      auditEventId: null,
    };
    set((s) => ({ reviewQueueItems: [item, ...s.reviewQueueItems] }));
    get().addAuditEvent({
      user: payload.reviewerName,
      agent: payload.agentType,
      action: `Staged ${payload.agentType} draft for review`,
      resource: `${id} / ${payload.patientName}`,
    });
  },

  markMedicationReviewed: (patientId) =>
    set((s) => ({
      medicationReviewsCompleted: [...s.medicationReviewsCompleted, patientId],
    })),
}));
