import { redirect } from "next/navigation";

export default function ForHospitalsPage() {
  redirect("/platform?tab=hospitals#hospitals");
}
