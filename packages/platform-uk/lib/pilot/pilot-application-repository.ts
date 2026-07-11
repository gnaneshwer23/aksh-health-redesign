/** @deprecated Use @/lib/access-requests/access-request-repository */
export {
  insertAccessRequest as insertPilotApplication,
  listRecentAccessRequests as listRecentPilotApplications,
  type AccessRequestRecord as PilotApplicationRecord,
} from "@/lib/access-requests/access-request-repository";
