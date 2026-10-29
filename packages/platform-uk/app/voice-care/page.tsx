import { redirect } from "next/navigation";

/** Legacy alias → public demo catalog (not gated investor Patel walkthrough). */
export default function VoiceCarePage() {
  redirect("/demo");
}
