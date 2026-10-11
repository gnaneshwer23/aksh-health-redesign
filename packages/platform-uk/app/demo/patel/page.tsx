import { OverviewDemoLauncher } from "@/components/demo/overview-demo-launcher";

type DemoPatelPageProps = {
  searchParams?: Promise<{ step?: string }>;
};

function resolveInitialStep(stepParam?: string) {
  const step = Number(stepParam ?? "0");
  return Number.isFinite(step) ? Math.max(0, step) : 0;
}

export default async function DemoPatelPage(props: DemoPatelPageProps) {
  const searchParams = await props.searchParams;
  return <OverviewDemoLauncher initialStep={resolveInitialStep(searchParams?.step)} />;
}
