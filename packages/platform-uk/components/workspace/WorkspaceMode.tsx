"use client";

import { createContext, useContext, type ReactNode } from "react";

const RealWorkspace = createContext(false);
const ProofEnvironment = createContext(false);

/** Set once from the server (root layout) so every client component agrees on real vs demo. */
export function WorkspaceModeProvider({ real, proof = false, children }: { real: boolean; proof?: boolean; children: ReactNode }) {
  return (
    <RealWorkspace.Provider value={real}>
      <ProofEnvironment.Provider value={proof && !real}>{children}</ProofEnvironment.Provider>
    </RealWorkspace.Provider>
  );
}

/** The labelled clinical-proof environment (lib/env/proof.ts): synthetic only, never production. */
export function useProofEnvironment() {
  return useContext(ProofEnvironment);
}

export function useRealWorkspace() {
  return useContext(RealWorkspace);
}
