"use client";

import { MedReviewQueue } from "@/components/dashboard/pharmacist/MedReviewQueue";
import { PharmacistHeroDemoPath } from "@/components/dashboard/pharmacist/PharmacistHeroDemoPath";
import { ReviewHonestyStrip } from "@/components/dashboard/review/ReviewHonestyStrip";

export default function PharmacistReviewsPage() {
  return (
    <div className="space-y-4">
      <PharmacistHeroDemoPath />
      <ReviewHonestyStrip surface="Pharmacist medication review" showHcpSessionLink={false} />
      <MedReviewQueue />
    </div>
  );
}
