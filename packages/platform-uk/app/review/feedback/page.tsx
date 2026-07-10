import { FeedbackCapture } from "@/components/review/feedback-capture";

export const dynamic = "force-dynamic";

export default function FeedbackCapturePage({
  searchParams
}: {
  searchParams?: { demo?: string; recording?: string };
}) {
  return <FeedbackCapture demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
