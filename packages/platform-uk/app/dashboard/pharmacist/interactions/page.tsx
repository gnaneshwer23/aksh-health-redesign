"use client";

import { InteractionChecker } from "@/components/dashboard/pharmacist/InteractionChecker";
import { PharmacistHeroDemoPath } from "@/components/dashboard/pharmacist/PharmacistHeroDemoPath";

export default function PharmacistInteractionsPage() {
  return (
    <div className="space-y-4">
      <PharmacistHeroDemoPath />
      <InteractionChecker />
    </div>
  );
}
