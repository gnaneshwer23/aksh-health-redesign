import { redirect } from "next/navigation";

export default function ForAdministratorsPage() {
  redirect("/platform?tab=administrators#administrators");
}
