"use client";

import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PRACTICE_NAME, searchPatients } from "@/lib/mock-data";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export function TopBar({ role, title }: { role: DashboardRole; title?: string }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ReturnType<typeof searchPatients>>([]);
  const { notificationCount, mobileSidebarOpen, setMobileSidebarOpen, toggleSidebar } = useDashboardStore();

  const handleSearch = (q: string) => {
    setSearch(q);
    setResults(searchPatients(q));
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4 shadow-sm">
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileSidebarOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="sm" className="hidden xl:flex" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">Aksh</span>
          {title && <span className="hidden sm:inline text-sm text-muted">· {title}</span>}
        </div>
        <div className="relative mx-auto hidden max-w-md flex-1 md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
          <Input
            className="pl-9"
            placeholder="Search patients, records..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Global search"
          />
          {results.length > 0 && (
            <div className="absolute top-full z-50 mt-1 w-full rounded-sm border border-border bg-card shadow-sm">
              {results.map((p) => (
                <Link key={p.id} href={`/dashboard/gp/patients/${p.id}`} className="block px-3 py-2 text-sm hover:bg-background" onClick={() => { setSearch(""); setResults([]); }}>
                  {p.name} · {p.nhsNumber}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button type="button" className="relative rounded-sm p-1 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`${notificationCount} notifications`}>
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] text-white">{notificationCount}</span>}
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs text-white">DM</span>
            <span className="text-sm">Dr Morgan</span>
          </div>
          <Link href="/" className="text-xs text-muted hover:text-primary">Sign Out</Link>
        </div>
      </header>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <Sidebar role={role} />
        </SheetContent>
      </Sheet>
    </>
  );
}
