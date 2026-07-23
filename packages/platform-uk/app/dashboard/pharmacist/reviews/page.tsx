"use client";

import { MedReviewQueue } from "@/components/dashboard/pharmacist/MedReviewQueue";
import { PharmacistHeroDemoPath } from "@/components/dashboard/pharmacist/PharmacistHeroDemoPath";

export default function PharmacistReviewsPage() {
  return (
    <div className="space-y-4">
      <PharmacistHeroDemoPath />
      <MedReviewQueue />
    </div>
  );
}
