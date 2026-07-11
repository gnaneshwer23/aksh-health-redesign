import { redirect } from "next/navigation";

export default function ForCliniciansPage() {
  redirect("/platform?tab=clinicians#clinicians");
}
