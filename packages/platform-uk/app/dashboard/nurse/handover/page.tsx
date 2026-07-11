"use client";

import { HandoverPanel } from "@/components/dashboard/nurse/HandoverPanel";
import { NursePatientHeader } from "@/components/dashboard/nurse/NursePatientHeader";

export default function NurseHandoverPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <NursePatientHeader />
      <HandoverPanel autoOpen />
    </div>
  );
}
