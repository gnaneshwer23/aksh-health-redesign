import NextAuth from "next-auth";

import type { UserRole } from "@/lib/onboarding/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      onboardingComplete: boolean;
      isEmailVerified: boolean;
      name?: string | null;
      organisation?: string | null;
      image?: string | null;
      /** Bound patient id for patient-role self-scope (FR-CORE-005). */
      boundPatientId?: string | null;
    };
    role?: UserRole;
    onboardingComplete?: boolean;
    name?: string | null;
    organisation?: string | null;
    isEmailVerified?: boolean;
    /** Passed via `session.update({ boundPatientId })` after invite-by-practice. */
    boundPatientId?: string | null;
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    onboardingComplete: boolean;
    isEmailVerified: boolean;
    name?: string | null;
    organisation?: string | null;
    boundPatientId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: UserRole;
    onboardingComplete: boolean;
    isEmailVerified: boolean;
    organisation?: string | null;
    /** Bound patient id for patient-role self-scope (FR-CORE-005). */
    boundPatientId?: string | null;
  }
}
