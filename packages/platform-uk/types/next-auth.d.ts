import NextAuth from "next-auth";

import type { UserRole } from "@/lib/onboarding/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      onboardingComplete: boolean;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    onboardingComplete: boolean;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: UserRole;
    onboardingComplete: boolean;
  }
}
