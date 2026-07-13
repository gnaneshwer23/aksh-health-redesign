import { redirect } from "next/navigation";

/** Fallback if config redirect is skipped; prefer next.config redirects. */
export default function VoiceCarePage() {
  redirect("/demo/patel");
}
