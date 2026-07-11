"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  PlatformAdministratorsPanel,
  PlatformCliniciansPanel,
  PlatformHospitalsPanel,
  PlatformOverviewPanel,
  PlatformPatientsPanel,
} from "@/components/marketing/platform-tab-panels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const PLATFORM_TABS = ["overview", "clinicians", "administrators", "hospitals", "patients"] as const;
export type PlatformTab = (typeof PLATFORM_TABS)[number];

const TAB_LABELS: Record<PlatformTab, string> = {
  overview: "Overview",
  clinicians: "Clinicians",
  administrators: "Administrators",
  hospitals: "Hospitals",
  patients: "Patients",
};

function resolveTab(value: string | null): PlatformTab {
  if (value && PLATFORM_TABS.includes(value as PlatformTab)) {
    return value as PlatformTab;
  }
  return "overview";
}

export function PlatformTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<PlatformTab>("overview");

  const syncTabFromUrl = useCallback(() => {
    const fromQuery = searchParams.get("tab");
    const fromHash = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    setActiveTab(resolveTab(fromQuery ?? (fromHash || null)));
  }, [searchParams]);

  useEffect(() => {
    syncTabFromUrl();
  }, [syncTabFromUrl]);

  useEffect(() => {
    const onHashChange = () => syncTabFromUrl();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [syncTabFromUrl]);

  function handleTabChange(value: string) {
    const tab = resolveTab(value);
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    const hash = tab === "overview" ? "" : `#${tab}`;
    router.replace(`${pathname}${query ? `?${query}` : ""}${hash}`, { scroll: false });
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <div className="sticky top-16 z-40 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-surface p-1">
            {PLATFORM_TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                id={tab === "overview" ? undefined : tab}
                className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-navy"
              >
                {TAB_LABELS[tab]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>

      <TabsContent value="overview" className="mt-0">
        <PlatformOverviewPanel />
      </TabsContent>
      <TabsContent value="clinicians" className="mt-0">
        <PlatformCliniciansPanel />
      </TabsContent>
      <TabsContent value="administrators" className="mt-0">
        <PlatformAdministratorsPanel />
      </TabsContent>
      <TabsContent value="hospitals" className="mt-0">
        <PlatformHospitalsPanel />
      </TabsContent>
      <TabsContent value="patients" className="mt-0">
        <PlatformPatientsPanel />
      </TabsContent>
    </Tabs>
  );
}
