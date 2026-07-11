"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import type { UserProfile } from "@/lib/profile/user-profile";
import { buildProfileGreeting } from "@/lib/profile/personalization";

type ProfileState = {
  profile: UserProfile | null;
  loading: boolean;
  greeting: string;
};

function sessionFallbackProfile(session: ReturnType<typeof useSession>["data"]): UserProfile | null {
  if (!session?.user?.id || !session.user.role) return null;

  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    fullName: session.user.name ?? null,
    role: session.user.role,
    organisation: session.user.organisation ?? null,
    practiceOds: null,
    preferences: {},
    onboardingComplete: session.user.onboardingComplete,
    emailVerified: session.user.isEmailVerified ?? true,
    identity: {},
    organisationDetails: {},
    source: "session",
  };
}

export function useUserProfile(): ProfileState {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(() => sessionFallbackProfile(session));
  const [loading, setLoading] = useState(status === "loading");

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (!session?.user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(sessionFallbackProfile(session));
    let cancelled = false;

    fetch("/api/profile")
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as UserProfile;
      })
      .then((data) => {
        if (cancelled || !data) return;
        setProfile(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session, status]);

  const greeting = buildProfileGreeting(profile?.fullName ?? session?.user?.name);

  return { profile, loading, greeting };
}
