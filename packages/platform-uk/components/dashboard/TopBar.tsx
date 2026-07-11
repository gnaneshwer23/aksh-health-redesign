"use client";

import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchPatients } from "@/lib/mock-data";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    title: "Review queue item pending",
    body: "GUARDIAN interaction check for Mrs Johnson requires approval.",
    time: "12 min ago",
  },
  {
    id: "n2",
    title: "Handover summary ready",
    body: "AI-generated night shift handover is awaiting nurse review.",
    time: "1 hr ago",
  },
  {
    id: "n3",
    title: "Capacity alert",
    body: "Digital Twin predicts ED surge probability at 73% in next 12 hours.",
    time: "3 hrs ago",
  },
];

export function TopBar({
  role,
  title,
  hideSearch,
}: {
  role: DashboardRole;
  title?: string;
  hideSearch?: boolean;
}) {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ReturnType<typeof searchPatients>>([]);
  const { notificationCount, mobileSidebarOpen, setMobileSidebarOpen, toggleSidebar } = useDashboardStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isPatientView = role === "patient";
  const showSearch = !hideSearch && !isPatientView;
  const headerTitle = isPatientView ? title ?? "My Health" : title;
  const displayName = session?.user?.name ?? session?.user?.email ?? "Aksh user";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSearch = (q: string) => {
    setSearch(q);
    setResults(searchPatients(q));
  };

  return (
    <>
      <header className="flex h-[60px] shrink-0 items-center gap-4 border-b border-border-subtle bg-card/95 px-4 shadow-sm backdrop-blur-sm">
        <Button variant="ghost" size="sm" className="rounded-lg lg:hidden" onClick={() => setMobileSidebarOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="sm" className="hidden rounded-lg xl:flex" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-primary">Aksh</span>
          {headerTitle && (
            <span className={cn("text-sm text-muted", isPatientView ? "inline font-medium" : "hidden sm:inline")}>
              {isPatientView ? headerTitle : `· ${headerTitle}`}
            </span>
          )}
        </div>
        {showSearch ? (
          <div className="relative mx-auto hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="rounded-xl border-border-subtle bg-surface-muted pl-9 shadow-none focus-visible:ring-primary/20"
              placeholder="Search patients, records..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label="Global search"
            />
            {results.length > 0 && (
              <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-border-subtle bg-card shadow-card-hover">
                {results.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/gp/patients/${p.id}`}
                    className="block px-4 py-2.5 text-sm transition-colors hover:bg-surface-muted"
                    onClick={() => {
                      setSearch("");
                      setResults([]);
                    }}
                  >
                    {p.name} · {p.nhsNumber}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          isPatientView && (
            <p className="mx-auto hidden flex-1 text-center text-sm font-medium text-primary md:block">
              {headerTitle}
            </p>
          )
        )}
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="relative rounded-xl p-2 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`${notificationCount} notifications`}
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="h-5 w-5 text-steel" />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
                {notificationCount}
              </span>
            )}
          </button>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white shadow-sm">
              {initials}
            </span>
            <span className="text-sm font-medium">{displayName}</span>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-primary"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </button>
        </div>
      </header>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-sidebar p-0">
          <Sidebar role={role} />
        </SheetContent>
      </Sheet>

      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent side="right" className="w-full max-w-sm">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <ul className="mt-4 space-y-3">
            {MOCK_NOTIFICATIONS.map((notification) => (
              <li key={notification.id} className="rounded-xl border border-border-subtle bg-surface-muted p-3">
                <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                <p className="mt-1 text-xs text-muted">{notification.body}</p>
                <p className="mt-2 text-[10px] text-muted">{notification.time}</p>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
