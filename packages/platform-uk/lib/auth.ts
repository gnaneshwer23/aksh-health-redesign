import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { authConfig, isClinicalOAuthConfigured } from "./auth/config";
import { DEMO_USER_SEEDS } from "./auth/demo-users";
import { nextAuthSecret } from "./auth-secret";
import type { UserRole } from "./onboarding/roles";
import type { IdentityData, OrganisationData } from "./onboarding/validation";
import { resolveOrganisationName } from "./profile/personalization";

const defaultDemoPasswordHash = "$2b$10$6iKQv2GujEgJKB9Auy8dK.clvty6jJfEGd.lZHML8BrjngJYLF7M6";

function resolveDemoPasswordHash(primaryEnvKey: string) {
  return process.env[primaryEnvKey]?.trim() || process.env.AKSH_DEMO_PASSWORD_HASH?.trim() || defaultDemoPasswordHash;
}

type DemoUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  onboardingComplete: boolean;
};

const DEMO_USERS: Record<string, DemoUser> = Object.fromEntries(
  DEMO_USER_SEEDS.map((user) => [
    user.email,
    {
      ...user,
      passwordHash: resolveDemoPasswordHash(`AKSH_DEMO_${user.role.toUpperCase().replace(/-/g, "_")}_PASSWORD_HASH`),
    },
  ])
);

type ClinicalOAuthProfile = {
  sub?: string;
  id?: string;
  email?: string;
  name?: string;
};

const oauthProviders = isClinicalOAuthConfigured()
  ? [
      {
        id: "clinical-oauth",
        name: "Clinical identity provider",
        type: "oauth" as const,
        clientId: authConfig.clinicalOAuth.clientId,
        clientSecret: authConfig.clinicalOAuth.clientSecret,
        authorization: authConfig.clinicalOAuth.authorizationUrl,
        token: authConfig.clinicalOAuth.tokenUrl,
        profile(profile: ClinicalOAuthProfile) {
          return {
            id: String(profile.sub ?? profile.id ?? "oauth-user"),
            email: String(profile.email ?? "clinician@example.com"),
            name: String(profile.name ?? "Clinical OAuth User"),
            role: "gp" as const,
            onboardingComplete: false,
          };
        },
      },
    ]
  : [];

async function resolveCredentialsUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const { findAuthUserByEmail, findUserByEmail } = await import("./auth/user-repository");
    const dbUser = await findAuthUserByEmail(normalizedEmail);
    if (dbUser) {
      const stored = await findUserByEmail(normalizedEmail);
      if (!stored) return null;

      const passwordMatches = await compare(password, stored.passwordHash);
      if (!passwordMatches) return null;

      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        onboardingComplete: dbUser.onboardingComplete,
      };
    }
  } catch {
    // Database unavailable — fall back to demo users.
  }

  const demoUser = DEMO_USERS[normalizedEmail];
  if (!demoUser) return null;

  const passwordMatches = await compare(password, demoUser.passwordHash);
  if (!passwordMatches) return null;

  return {
    id: demoUser.id,
    email: demoUser.email,
    name: demoUser.name,
    role: demoUser.role,
    onboardingComplete: demoUser.onboardingComplete,
  };
}

async function enrichTokenFromProfile(
  userId: string,
  role: UserRole,
  fallbackName?: string | null
): Promise<{ name: string | null; organisation: string | null }> {
  try {
    const { findProfileByUserId } = await import("./auth/user-repository");
    const { getOnboardingProgress } = await import("./onboarding/onboarding-progress-repository");
    const profile = await findProfileByUserId(userId);
    const onboarding = await getOnboardingProgress(userId);
    const identity = (onboarding?.identity ?? {}) as IdentityData;
    const organisationDetails = (onboarding?.organisation ?? {}) as OrganisationData;
    const resolvedRole = profile?.role ?? onboarding?.role ?? role;

    return {
      name: profile?.fullName ?? fallbackName ?? null,
      organisation: resolveOrganisationName(resolvedRole, profile, identity, organisationDetails),
    };
  } catch {
    return {
      name: fallbackName ?? null,
      organisation: null,
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...oauthProviders,
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "doctor@akshhealth.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await resolveCredentialsUser(credentials.email, credentials.password);
        if (!user) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          onboardingComplete: user.onboardingComplete,
        };
      },
    }),
  ],

  pages: {
    signIn: "/signin",
    error: "/auth/error",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.onboardingComplete = user.onboardingComplete ?? false;

        const enriched = await enrichTokenFromProfile(user.id, user.role, user.name);
        token.name = enriched.name ?? user.name;
        token.organisation = enriched.organisation;
      }

      if (trigger === "update" && session) {
        if (session.role) {
          token.role = session.role;
        }
        if (typeof session.onboardingComplete === "boolean") {
          token.onboardingComplete = session.onboardingComplete;
        }
        if (session.name) {
          token.name = session.name;
        }
        if (session.organisation) {
          token.organisation = session.organisation;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.onboardingComplete = Boolean(token.onboardingComplete);
        session.user.name = (token.name as string | null | undefined) ?? session.user.name;
        session.user.organisation = (token.organisation as string | null | undefined) ?? null;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },

  secret: nextAuthSecret,
};