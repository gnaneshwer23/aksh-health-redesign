import { FeedbackCapture } from "@/components/review/feedback-capture";

export const dynamic = "force-dynamic";

export default async function FeedbackCapturePage(
  props: {
    searchParams?: Promise<{ demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <FeedbackCapture demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
