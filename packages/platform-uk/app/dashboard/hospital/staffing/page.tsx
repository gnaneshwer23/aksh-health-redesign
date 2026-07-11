"use client";

import { StaffingPanel } from "@/components/dashboard/hospital/StaffingPanel";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { hospitalData } from "@/lib/mock-data";
import { getPersonalizedLabel } from "@/lib/profile/personalization";

export default function HospitalStaffingPage() {
  const { profile } = useUserProfile();
  const hospitalName = getPersonalizedLabel(profile, hospitalData.hospitalName);

  return <StaffingPanel data={hospitalData} hospitalName={hospitalName} />;
}
