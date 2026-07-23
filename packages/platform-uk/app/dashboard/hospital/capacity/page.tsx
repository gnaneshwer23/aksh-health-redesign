"use client";

import { CapacityPanel } from "@/components/dashboard/hospital/CapacityPanel";
import { HospitalHeroDemoPath } from "@/components/dashboard/hospital/HospitalHeroDemoPath";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { hospitalData } from "@/lib/mock-data";
import { getPersonalizedLabel } from "@/lib/profile/personalization";

export default function HospitalCapacityPage() {
  const { profile } = useUserProfile();
  const hospitalName = getPersonalizedLabel(profile, hospitalData.hospitalName);

  return (
    <>
      <div className="px-4 pt-4">
        <HospitalHeroDemoPath />
      </div>
      <CapacityPanel data={hospitalData} hospitalName={hospitalName} />
    </>
  );
}
