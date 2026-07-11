import { OverviewDemoLauncher } from "@/components/demo/overview-demo-launcher";

type DemoPatelPageProps = {
  searchParams?: { step?: string };
};

function resolveInitialStep(stepParam?: string) {
  const step = Number(stepParam ?? "0");
  return Number.isFinite(step) ? Math.max(0, step) : 0;
}

export default function DemoPatelPage({ searchParams }: DemoPatelPageProps) {
  return <OverviewDemoLauncher initialStep={resolveInitialStep(searchParams?.step)} />;
}
