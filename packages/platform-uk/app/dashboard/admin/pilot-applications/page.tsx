import { redirect } from "next/navigation";

export default function LegacyAdminPilotApplicationsRedirect() {
  redirect("/dashboard/admin/organisation-enquiries");
}
