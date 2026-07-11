import { CapacityPanel } from "@/components/dashboard/hospital/CapacityPanel";
import { hospitalData } from "@/lib/mock-data";

export default function HospitalCapacityPage() {
  return <CapacityPanel data={hospitalData} />;
}
