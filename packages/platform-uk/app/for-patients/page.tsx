import { redirect } from "next/navigation";

export default function ForPatientsPage() {
  redirect("/platform?tab=patients#patients");
}
