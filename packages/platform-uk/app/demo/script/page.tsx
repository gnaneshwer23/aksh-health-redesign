import { DemoLaunchScript } from "@/components/demo/DemoLaunchScript";

export const metadata = {
  title: "Demo script · Capture → export | Aksh Health",
  description:
    "10–15 minute guided demo: Capture → Draft → Approve → SHIELD → sim write-back → FHIR/PDF export. Synthetic · liveEmis:false."
};

export default function DemoScriptPage() {
  return <DemoLaunchScript />;
}
