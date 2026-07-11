import { WardStatusPanel } from "@/components/dashboard/hospital/WardStatusPanel";
import { hospitalData } from "@/lib/mock-data";

export default function HospitalWardsPage() {
  return <WardStatusPanel data={hospitalData} fullPage />;
}
