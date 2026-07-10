"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  getRoleDefinition,
  getStepIndex,
  type OnboardingStepId,
  type UserRole,
} from "./roles";
import type {
  ConsentData,
  IdentityData,
  OrganisationData,
  PreferencesData,
} from "./validation";

export type OnboardingState = {
  role: UserRole | null;
  currentStep: number;
  totalSteps: number;
  identity: IdentityData;
  organisation: OrganisationData;
  preferences: PreferencesData;
  consents: ConsentData;
  tutorialScreen: number;
  completedSteps: number[];
  savedAt: string | null;
  verificationStatus: Record<string, "idle" | "pending" | "verified" | "error">;
  setRole: (role: UserRole) => void;
  setIdentity: (data: IdentityData) => void;
  setOrganisation: (data: OrganisationData) => void;
  setPreferences: (data: PreferencesData) => void;
  setConsents: (data: ConsentData) => void;
  setTutorialScreen: (screen: number) => void;
  markStepComplete: (stepIndex: number) => void;
  setVerificationStatus: (
    key: string,
    status: "idle" | "pending" | "verified" | "error"
  ) => void;
  saveForLater: () => void;
  reset: () => void;
  syncStepFromId: (stepId: OnboardingStepId) => void;
};

const initialState = {
  role: null as UserRole | null,
  currentStep: 0,
  totalSteps: 0,
  identity: {} as IdentityData,
  organisation: {} as OrganisationData,
  preferences: {} as PreferencesData,
  consents: {} as ConsentData,
  tutorialScreen: 0,
  completedSteps: [] as number[],
  savedAt: null as string | null,
  verificationStatus: {} as Record<
    string,
    "idle" | "pending" | "verified" | "error"
  >,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setRole: (role) => {
        const def = getRoleDefinition(role);
        set({
          role,
          totalSteps: def?.steps.length ?? 0,
          currentStep: 1,
          completedSteps: [0],
          identity: {},
          organisation: {},
          preferences: {},
          consents: {},
          tutorialScreen: 0,
          verificationStatus: {},
        });
      },
      setIdentity: (data) => set({ identity: data }),
      setOrganisation: (data) => set({ organisation: data }),
      setPreferences: (data) => set({ preferences: data }),
      setConsents: (data) => set({ consents: data }),
      setTutorialScreen: (screen) => set({ tutorialScreen: screen }),
      markStepComplete: (stepIndex) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(stepIndex)
            ? state.completedSteps
            : [...state.completedSteps, stepIndex],
          currentStep: Math.max(state.currentStep, stepIndex + 1),
        })),
      setVerificationStatus: (key, status) =>
        set((state) => ({
          verificationStatus: { ...state.verificationStatus, [key]: status },
        })),
      saveForLater: () => set({ savedAt: new Date().toISOString() }),
      reset: () => set(initialState),
      syncStepFromId: (stepId) => {
        const { role } = get();
        const index = getStepIndex(role, stepId);
        if (index >= 0) {
          set({ currentStep: index, totalSteps: getRoleDefinition(role)?.steps.length ?? 0 });
        }
      },
    }),
    {
      name: "aksh_onboarding_v2",
      partialize: (state) => ({
        role: state.role,
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
        identity: state.identity,
        organisation: state.organisation,
        preferences: state.preferences,
        consents: state.consents,
        tutorialScreen: state.tutorialScreen,
        completedSteps: state.completedSteps,
        savedAt: state.savedAt,
        verificationStatus: state.verificationStatus,
      }),
    }
  )
);

export function markOnboardingComplete(role: UserRole) {
  if (typeof window === "undefined") return;
  localStorage.setItem("aksh_user_role", role);
  localStorage.setItem("aksh_onboarding_done", "true");
}
