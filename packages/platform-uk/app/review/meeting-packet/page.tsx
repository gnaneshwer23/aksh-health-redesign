import { MeetingPacketPage, type MeetingPacketFilterId } from "@/components/review/meeting-packet-page";

export const dynamic = "force-dynamic";

const allowedFilters: MeetingPacketFilterId[] = ["strong", "incomplete", "near-promotion", "remediation"];

export default function ReviewMeetingPacketPage({
  searchParams
}: {
  searchParams?: { filter?: string; demo?: string; recording?: string };
}) {
  const requestedFilter = searchParams?.filter;
  const initialFilter: MeetingPacketFilterId =
    requestedFilter && allowedFilters.includes(requestedFilter as MeetingPacketFilterId)
      ? (requestedFilter as MeetingPacketFilterId)
      : "strong";

  return (
    <MeetingPacketPage
      demoMode={searchParams?.demo === "1"}
      initialFilter={initialFilter}
      recordingMode={searchParams?.recording === "1"}
    />
  );
}
