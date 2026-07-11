import { StaffingPanel } from "@/components/dashboard/hospital/StaffingPanel";
import { hospitalData } from "@/lib/mock-data";

export default function HospitalStaffingPage() {
  return <StaffingPanel data={hospitalData} />;
}
