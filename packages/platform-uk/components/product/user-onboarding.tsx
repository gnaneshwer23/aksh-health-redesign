"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PublicProductNav } from "@/components/product/public-product-nav";
import {
  COMPLIANCE_BADGES,
  COMPLIANCE_DISCLAIMER,
  DASHBOARD_LABELS,
  PROOF_MODE_BANNER,
  ROLE_LABELS
} from "@/lib/compliance-labels";

type OnboardingRole = "clinician" | "nurse" | "pharmacist" | "admin" | "regional";

type OnboardingState = {
  role: OnboardingRole;
  step: number;
  practiceName: string;
  practiceSize: string;
  complianceAck: Record<string, boolean>;
  completed: boolean;
};

const STORAGE_KEY = "aksh-onboarding-v1";

const roles: Array<{ id: OnboardingRole; label: string; promise: string; dashboardHref: string }> = [
  { id: "clinician", label: ROLE_LABELS.clinician, promise: "Review AI drafts safely.", dashboardHref: "/dashboard/gp" },
  { id: "nurse", label: ROLE_LABELS.nurse, promise: "Capture observations and handover.", dashboardHref: "/dashboard/nurse" },
  { id: "pharmacist", label: ROLE_LABELS.pharmacist, promise: "Medication review and GUARDIAN.", dashboardHref: "/dashboard/pharmacist" },
  { id: "admin", label: ROLE_LABELS.admin, promise: "Integration health and SHIELD.", dashboardHref: "/dashboard/admin" },
  { id: "regional", label: ROLE_LABELS.regional, promise: "Population aggregates only.", dashboardHref: "/dashboard/regional" }
];

const STEPS = ["Role", "Practice profile", "Compliance", "Dashboard tour", "Complete"];

const defaultState: OnboardingState = {
  role: "clinician",
  step: 0,
  practiceName: "",
  practiceSize: "1-5 clinicians",
  complianceAck: {},
  completed: false
};

function loadState(): OnboardingState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
  } catch {
    return defaultState;
  }
}

function saveState(state: OnboardingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function UserOnboarding() {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  function update(partial: Partial<OnboardingState>) {
    setState((current) => {
      const next = { ...current, ...partial };
      saveState(next);
      return next;
    });
  }

  const activeRole = roles.find((role) => role.id === state.role) ?? roles[0];
  const complianceReady = COMPLIANCE_BADGES.every((badge) => state.complianceAck[badge.id]);

  function nextStep() {
    update({ step: Math.min(state.step + 1, STEPS.length - 1) });
  }

  function prevStep() {
    update({ step: Math.max(state.step - 1, 0) });
  }

  function complete() {
    update({ step: STEPS.length - 1, completed: true });
  }

  if (!hydrated) {
    return <main className="product-page"><PublicProductNav /></main>;
  }

  return (
    <main className="product-page">
      <PublicProductNav ctaHref="/signin" ctaLabel="Sign in" />

      <section className="product-simple-hero onboarding-hero">
        <p className="product-kicker">Role onboarding · Phase B</p>
        <h1>Five-step wizard for your care-team role.</h1>
        <p>Persisted locally in this build. Postgres onboarding table available when DATABASE_URL is configured.</p>
      </section>

      <div className="onboarding-proof-banner">
        <strong>{PROOF_MODE_BANNER.title}</strong>
        <p>{PROOF_MODE_BANNER.body}</p>
      </div>

      <ol className="onboarding-wizard-steps" aria-label="Onboarding progress">
        {STEPS.map((label, index) => (
          <li className={index === state.step ? "is-active" : index < state.step ? "is-done" : ""} key={label}>
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {state.step === 0 ? (
        <section className="persona-switcher" aria-label="Choose onboarding role">
          {roles.map((role) => (
            <button
              className={`persona-tab${role.id === state.role ? " is-active" : ""}`}
              key={role.id}
              onClick={() => update({ role: role.id })}
              type="button"
            >
              <span>{role.label}</span>
              <strong>{role.promise}</strong>
            </button>
          ))}
        </section>
      ) : null}

      <section className="personalized-onboarding-panel">
        {state.step === 0 ? (
          <div className="personalized-onboarding-panel__copy">
            <h2>{activeRole.label}</h2>
            <p>Selected path routes to {DASHBOARD_LABELS[activeRole.id === "clinician" ? "clinician" : activeRole.id]}.</p>
            <button className="product-button product-button--primary" onClick={nextStep} type="button">
              Continue to practice profile
            </button>
          </div>
        ) : null}

        {state.step === 1 ? (
          <div className="onboarding-form panel stack">
            <h2>Practice profile</h2>
            <label>
              Practice name
              <input onChange={(e) => update({ practiceName: e.target.value })} value={state.practiceName} />
            </label>
            <label>
              Practice size
              <select onChange={(e) => update({ practiceSize: e.target.value })} value={state.practiceSize}>
                <option>1-5 clinicians</option>
                <option>6-20 clinicians</option>
                <option>21+ clinicians</option>
                <option>Regional network</option>
              </select>
            </label>
            <div className="actions">
              <button className="button secondary" onClick={prevStep} type="button">Back</button>
              <button className="button primary" disabled={!state.practiceName.trim()} onClick={nextStep} type="button">Continue</button>
            </div>
          </div>
        ) : null}

        {state.step === 2 ? (
          <div className="onboarding-form panel stack">
            <h2>Compliance acknowledgement</h2>
            <p className="product-muted">{COMPLIANCE_DISCLAIMER}</p>
            {COMPLIANCE_BADGES.map((badge) => (
              <label className="onboarding-check" key={badge.id}>
                <input
                  checked={Boolean(state.complianceAck[badge.id])}
                  onChange={(e) =>
                    update({ complianceAck: { ...state.complianceAck, [badge.id]: e.target.checked } })
                  }
                  type="checkbox"
                />
                <div>
                  <strong>{badge.label}</strong>
                  <p>{badge.detail}</p>
                </div>
              </label>
            ))}
            <div className="actions">
              <button className="button secondary" onClick={prevStep} type="button">Back</button>
              <button className="button primary" disabled={!complianceReady} onClick={nextStep} type="button">Acknowledge & continue</button>
            </div>
          </div>
        ) : null}

        {state.step === 3 ? (
          <div className="onboarding-progress-card panel stack">
            <h2>Dashboard tour</h2>
            <ol className="onboarding-progress-list">
              <li><span>1</span><div><strong>Open {DASHBOARD_LABELS[activeRole.id === "clinician" ? "clinician" : activeRole.id]}</strong></div></li>
              <li><span>2</span><div><strong>Review synthetic HITL queue items</strong></div></li>
              <li><span>3</span><div><strong>Confirm SHIELD audit on decisions</strong></div></li>
              <li><span>4</span><div><strong>Export FHIR evidence bundle after case Accept</strong></div></li>
            </ol>
            <div className="actions">
              <button className="button secondary" onClick={prevStep} type="button">Back</button>
              <Link className="button secondary" href={activeRole.dashboardHref}>Preview dashboard</Link>
              <button className="button primary" onClick={nextStep} type="button">Finish tour</button>
            </div>
          </div>
        ) : null}

        {state.step === 4 ? (
          <div className="panel stack">
            <h2>Onboarding complete</h2>
            <p>
              {state.completed
                ? `Welcome, ${activeRole.label}. Practice "${state.practiceName}" is configured for synthetic proof mode.`
                : "Confirm completion to save your onboarding state."}
            </p>
            <div className="actions">
              {!state.completed ? (
                <button className="button primary" onClick={complete} type="button">Complete onboarding</button>
              ) : (
                <Link className="button primary" href={activeRole.dashboardHref}>
                  Go to {DASHBOARD_LABELS[activeRole.id === "clinician" ? "clinician" : activeRole.id]}
                </Link>
              )}
              <Link className="button secondary" href="/pilot">Pilot program</Link>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
