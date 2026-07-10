import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";

import { authConfig, isClinicalOAuthConfigured } from "./auth/config";
import { nextAuthSecret } from "./auth-secret";

const defaultDemoPasswordHash = "$2b$10$QkvoReeIS7Cm9wEtffhnT.l.oY1gOcPjMYOkcNco7MT2SSi7aFfC6";

function resolveDemoPasswordHash(primaryEnvKey: string) {
  return process.env[primaryEnvKey]?.trim() || process.env.AKSH_DEMO_PASSWORD_HASH?.trim() || defaultDemoPasswordHash;
}

// In-memory user store (demo only - use database in production)
const DEMO_USERS: Record<string, { id: string; email: string; name: string; passwordHash: string; role: "clinical_reviewer" | "operations_lead" }> = {
  "doctor@akshhealth.com": {
    id: "user-001",
    email: "doctor@akshhealth.com",
    name: "Dr. Clinical User",
    passwordHash: resolveDemoPasswordHash("AKSH_DEMO_DOCTOR_PASSWORD_HASH"),
    role: "clinical_reviewer"
  },
  "reviewer@akshhealth.com": {
    id: "user-002",
    email: "reviewer@akshhealth.com",
    name: "Dr. Reviewer",
    passwordHash: resolveDemoPasswordHash("AKSH_DEMO_REVIEWER_PASSWORD_HASH"),
    role: "operations_lead"
  },
  "smoke@akshhealth.com": {
    id: "user-003",
    email: "smoke@akshhealth.com",
    name: "Smoke Loop Reviewer",
    passwordHash: resolveDemoPasswordHash("AKSH_DEMO_SMOKE_PASSWORD_HASH"),
    role: "clinical_reviewer"
  }
};

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
            role: "clinical_reviewer" as const
          };
        }
      }
    ]
  : [];

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

        const user = DEMO_USERS[credentials.email];

        const passwordMatches = user ? await compare(credentials.password, user.passwordHash) : false;

        if (!user || !passwordMatches) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      },
    }),
  ],

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as "clinical_reviewer" | "operations_lead";
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: nextAuthSecret,
};
