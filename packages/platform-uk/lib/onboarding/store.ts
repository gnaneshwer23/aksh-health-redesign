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

const DEBOUNCE_MS = 800;

type PersistableOnboardingState = {
  role: UserRole | null;
  currentStep: number;
  totalSteps: number;
  identity: IdentityData;
  organisation: OrganisationData;
  preferences: PreferencesData;
  consents: ConsentData;
  tutorialScreen: number;
  completedSteps: number[];
};

export type OnboardingState = PersistableOnboardingState & {
  savedAt: string | null;
  verificationStatus: Record<string, "idle" | "pending" | "verified" | "error">;
  isHydrated: boolean;
  isSaving: boolean;
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
  saveForLater: () => Promise<string | null>;
  hydrateFromServer: () => Promise<boolean>;
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
  isHydrated: false,
  isSaving: false,
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let serverSyncEnabled = false;

function pickPersistableState(state: OnboardingState): PersistableOnboardingState {
  return {
    role: state.role,
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    identity: state.identity,
    organisation: state.organisation,
    preferences: state.preferences,
    consents: state.consents,
    tutorialScreen: state.tutorialScreen,
    completedSteps: state.completedSteps,
  };
}

async function persistToServer(
  payload: PersistableOnboardingState
): Promise<string | null> {
  const response = await fetch("/api/onboarding/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: payload.role,
      currentStep: payload.currentStep,
      totalSteps: payload.totalSteps,
      identity: payload.identity,
      organisation: payload.organisation,
      preferences: payload.preferences,
      consents: payload.consents,
      tutorialScreen: payload.tutorialScreen,
      completedSteps: payload.completedSteps,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as { savedAt?: string };
  return body.savedAt ?? new Date().toISOString();
}

function schedulePersistSave(state: OnboardingState) {
  if (!serverSyncEnabled || !state.isHydrated) return;

  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    const payload = pickPersistableState(useOnboardingStore.getState());
    useOnboardingStore.setState({ isSaving: true });
    void persistToServer(payload)
      .then((savedAt) => {
        if (savedAt) {
          useOnboardingStore.setState({ savedAt, isSaving: false });
        } else {
          useOnboardingStore.setState({ isSaving: false });
        }
      })
      .catch(() => {
        useOnboardingStore.setState({ isSaving: false });
      });
  }, DEBOUNCE_MS);
}

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
      saveForLater: async () => {
        const payload = pickPersistableState(get());
        set({ isSaving: true });
        try {
          const savedAt = await persistToServer(payload);
          if (savedAt) {
            set({ savedAt, isSaving: false });
            return savedAt;
          }
          set({ isSaving: false });
          return null;
        } catch {
          set({ isSaving: false });
          return null;
        }
      },
      hydrateFromServer: async () => {
        try {
          const response = await fetch("/api/onboarding/resume");
          if (response.status === 404) {
            serverSyncEnabled = true;
            set({ isHydrated: true });
            return false;
          }
          if (!response.ok) {
            serverSyncEnabled = true;
            set({ isHydrated: true });
            return false;
          }

          const data = (await response.json()) as {
            role: UserRole | null;
            currentStep: number;
            totalSteps: number | null;
            identity: IdentityData;
            organisation: OrganisationData;
            preferences: PreferencesData;
            consents: ConsentData;
            tutorialScreen: number;
            completedSteps: number[];
            savedAt: string;
          };

          const role = data.role;
          const totalSteps =
            data.totalSteps ?? getRoleDefinition(role)?.steps.length ?? 0;

          serverSyncEnabled = true;
          set({
            role,
            currentStep: data.currentStep,
            totalSteps,
            identity: data.identity ?? {},
            organisation: data.organisation ?? {},
            preferences: data.preferences ?? {},
            consents: data.consents ?? {},
            tutorialScreen: data.tutorialScreen ?? 0,
            completedSteps: data.completedSteps ?? [],
            savedAt: data.savedAt,
            isHydrated: true,
          });
          return true;
        } catch {
          serverSyncEnabled = true;
          set({ isHydrated: true });
          return false;
        }
      },
      reset: () => set({ ...initialState, isHydrated: true }),
      syncStepFromId: (stepId) => {
        const { role } = get();
        const index = getStepIndex(role, stepId);
        if (index >= 0) {
          set({
            currentStep: index,
            totalSteps: getRoleDefinition(role)?.steps.length ?? 0,
          });
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
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = false;
        }
      },
    }
  )
);

useOnboardingStore.subscribe((state, previousState) => {
  if (!state.isHydrated) return;

  const fields: (keyof PersistableOnboardingState)[] = [
    "role",
    "currentStep",
    "totalSteps",
    "identity",
    "organisation",
    "preferences",
    "consents",
    "tutorialScreen",
    "completedSteps",
  ];

  const changed = fields.some((field) => state[field] !== previousState[field]);
  if (changed) {
    schedulePersistSave(state);
  }
});

export function markOnboardingComplete(role: UserRole) {
  if (typeof window === "undefined") return;
  localStorage.setItem("aksh_user_role", role);
  localStorage.setItem("aksh_onboarding_done", "true");
}

export function formatSavedAt(savedAt: string | null): string | null {
  if (!savedAt) return null;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(savedAt));
  } catch {
    return savedAt;
  }
}
