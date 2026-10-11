"use client";

import { createContext, useContext, type ReactNode } from "react";

const RealWorkspace = createContext(false);

/** Set once from the server (root layout) so every client component agrees on real vs demo. */
export function WorkspaceModeProvider({ real, children }: { real: boolean; children: ReactNode }) {
  return <RealWorkspace.Provider value={real}>{children}</RealWorkspace.Provider>;
}

export function useRealWorkspace() {
  return useContext(RealWorkspace);
}
