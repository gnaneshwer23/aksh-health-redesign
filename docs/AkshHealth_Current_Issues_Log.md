# AkshHealth Pilot - Current Issues Log
**Date:** April 24, 2026
**Status:** Pilot Phase 1 (End-to-End Core Complete, Environment Configuration Pending)

This document tracks the current technical and operational blockers we are facing while testing the end-to-end flow of the platform, as well as recently resolved bugs.

---

## 1. Active Technical Issues & Blockers

### 🔴 1.1 Docker / Medplum Persistence Failure
*   **Symptom:** Running `docker-compose up -d` fails with an `operation not permitted` error on the Docker daemon socket (`/var/run/docker.sock`).
*   **Impact:** The Medplum FHIR server and local PostgreSQL database cannot start. When a clinician clicks "Accept Draft", the Next.js app will successfully freeze the artifact but fail to push it to Medplum.
*   **Resolution Required:** 
    *   Docker Desktop must be actively running on the host Mac before the script is executed.
    *   macOS permissions may need to be adjusted to grant terminal/VSCode access to the Docker daemon.

### 🟡 1.2 Missing Production API Keys
*   **Symptom:** Live extraction and audio transcription will silently fail or use hardcoded simulated fallbacks.
*   **Impact:** The system cannot process *novel* data yet. It is currently locked into "Demo Simulation Mode".
*   **Resolution Required:**
    *   Add a valid Anthropic API key to `agents/synthesis/.env` (`ANTHROPIC_API_KEY`).
    *   Add a valid Deepgram API key to `akshhealth-uk-eu-platform/.env.local` (`DEEPGRAM_API_KEY`).

### 🟡 1.3 Ephemeral Application State
*   **Symptom:** Because the Next.js platform currently uses an in-memory or filesystem mock for `lib/review-case-repository.ts` rather than querying the Medplum database directly as the source of truth, refreshing or restarting the Next.js dev server wipes the state.
*   **Impact:** Review cases disappear between server restarts.
*   **Resolution Required:** Future sprint needed to wire Next.js data fetching directly to the Medplum PostgreSQL database instead of the local mock.

---

## 2. Active Operational Blockers

### 🔴 2.1 Lack of Appointed Clinical Safety Officer (CSO)
*   **Symptom:** The DCB0129 Clinical Risk Management Plan and Hazard Log we generated are currently signed by an "Interim AI".
*   **Impact:** NHS Digital and ICS pilot sponsors will not allow the system to process real patient data (even in shadow mode) without a human clinician signing the safety case.
*   **Resolution Required:** Accelerate the hiring or contracting of a registered clinician with DCB0129 certification.

---

## 3. Recently Resolved Issues ✅

*   **Fixed: React Hooks Violation (Next.js)**
    *   *Issue:* The Review Queue page crashed with a "Rendered more hooks than during the previous render" error due to an early `return` statement placed before a `useMemo` hook.
    *   *Fix:* Hook order was corrected in `review-page.tsx`.
*   **Fixed: HAZ-004 Automation Bias**
    *   *Issue:* Clinicians could blindly click "Accept" without reviewing AI drafts.
    *   *Fix:* Implemented a mandatory "Clinical Accountability" checkbox constraint in the UI.
*   **Fixed: HAZ-002 Red Flag Omissions**
    *   *Issue:* The LLM could hallucinate or omit critical symptoms like "chest pain".
    *   *Fix:* Wrote a deterministic Python regex engine (`safety_rules.py`) that scans the raw transcript directly to force high-severity flags.
