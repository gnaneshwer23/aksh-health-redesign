"use client";

import { HandoverPanel } from "@/components/dashboard/nurse/HandoverPanel";
import { NurseHeroDemoPath } from "@/components/dashboard/nurse/NurseHeroDemoPath";
import { NursePatientHeader } from "@/components/dashboard/nurse/NursePatientHeader";

export default function NurseHandoverPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <NurseHeroDemoPath />
      <NursePatientHeader />
      <HandoverPanel autoOpen />
    </div>
  );
}
