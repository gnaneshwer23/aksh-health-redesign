import { redirect } from "next/navigation";

import { SIGNUP_ROLE_MAP } from "@/lib/onboarding/roles";

type SignupPageProps = {
  searchParams: { role?: string };
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  const role = searchParams.role;
  const mappedRole = role ? (SIGNUP_ROLE_MAP[role] ?? role) : null;

  if (mappedRole) {
    redirect(`/onboarding/role-select?role=${mappedRole}`);
  }

  redirect("/onboarding/role-select");
}
