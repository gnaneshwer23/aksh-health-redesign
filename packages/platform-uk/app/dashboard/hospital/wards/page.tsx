"use client";

import { WardStatusPanel } from "@/components/dashboard/hospital/WardStatusPanel";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { hospitalData } from "@/lib/mock-data";
import { getPersonalizedLabel } from "@/lib/profile/personalization";

export default function HospitalWardsPage() {
  const { profile } = useUserProfile();
  const hospitalName = getPersonalizedLabel(profile, hospitalData.hospitalName);

  return <WardStatusPanel data={hospitalData} fullPage hospitalName={hospitalName} />;
}
