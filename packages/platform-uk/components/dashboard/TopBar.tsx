"use client";

import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

import { DemoMenu } from "@/components/dashboard/DemoMenu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchPatients } from "@/lib/mock-data";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
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
    body: "Risk-state model predicts ED surge probability at 73% in next 12 hours (demo — not a physiological twin).",
    time: "3 hrs ago",
  },
];

export function TopBar({
  role,
  title,
  hideSearch,
  organisation,
  showBrandMark = true,
}: {
  role: DashboardRole;
  title?: string;
  hideSearch?: boolean;
  organisation?: string | null;
  /** When false (sidebar visible), omit duplicate Aksh mark — brand lives in Sidebar. */
  showBrandMark?: boolean;
}) {
  const { profile, loading, greeting } = useUserProfile();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ReturnType<typeof searchPatients>>([]);
  const { notificationCount, mobileSidebarOpen, setMobileSidebarOpen, toggleSidebar } =
    useDashboardStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isPatientView = role === "patient";
  const showSearch = !hideSearch && !isPatientView;
  const resolvedOrganisation = organisation ?? profile?.organisation ?? null;
  const headerTitle = isPatientView ? title ?? "My Health" : title;
  const displayName = profile?.fullName?.trim() || "Aksh user";
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
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle/60 bg-card/90 px-4 shadow-sm backdrop-blur-md sm:px-5">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full lg:hidden"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="hidden rounded-full xl:flex"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Brand mark only when sidebar is hidden (patient / hideSidebar) or mobile sheet. */}
        <div className="flex min-w-0 items-center gap-2">
          {showBrandMark || isPatientView ? (
            <>
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent text-[10px] font-bold text-white shadow-soft lg:hidden">
                A
              </span>
              {showBrandMark ? (
                <span className="hidden items-center gap-2 sm:flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent text-[10px] font-bold text-white shadow-soft">
                    A
                  </span>
                  <span className="font-display text-sm font-bold text-primary">Aksh</span>
                </span>
              ) : null}
            </>
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent text-[10px] font-bold text-white shadow-soft lg:hidden">
              A
            </span>
          )}
          {headerTitle ? (
            <span
              className={cn(
                "truncate text-sm text-muted",
                isPatientView ? "inline font-medium text-foreground" : "hidden sm:inline"
              )}
              title={
                !isPatientView && resolvedOrganisation
                  ? `${headerTitle}, ${resolvedOrganisation}`
                  : headerTitle
              }
            >
              {isPatientView ? headerTitle : headerTitle}
              {!isPatientView && resolvedOrganisation ? (
                <span className="text-muted/80"> · {resolvedOrganisation}</span>
              ) : null}
            </span>
          ) : null}
        </div>

        {!isPatientView ? (
          <p
            className="hidden max-w-[12rem] truncate text-[11px] text-muted xl:block"
            title={loading ? undefined : greeting}
          >
            {loading ? (
              <span className="inline-block h-3 w-28 animate-pulse rounded bg-muted/30" />
            ) : (
              greeting
            )}
          </p>
        ) : null}

        {showSearch ? (
          <div className="relative mx-auto hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="h-9 rounded-full border-border-subtle/80 bg-surface pl-10 shadow-none focus-visible:ring-accent/35"
              placeholder="Search patients, records..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label="Global search"
            />
            {results.length > 0 && (
              <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border-subtle bg-card shadow-card-hover">
                {results.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/gp/patients/${p.id}`}
                    className="block px-4 py-2.5 text-sm transition-colors hover:bg-[#F3F7FA]"
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

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {!isPatientView ? <DemoMenu role={role} /> : null}
          <button
            type="button"
            className="relative rounded-full p-2 transition-colors hover:bg-pastel-mint/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white shadow-soft">
              {loading ? "…" : initials}
            </span>
            <span className="max-w-[8rem] truncate text-sm font-medium">
              {loading ? (
                <span className="inline-block h-4 w-20 animate-pulse rounded bg-muted/30" />
              ) : (
                displayName
              )}
            </span>
          </div>
          <button
            type="button"
            className="rounded-full px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-pastel-mint/60 hover:text-accent"
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
              <li
                key={notification.id}
                className="rounded-3xl border border-border-subtle bg-surface p-4 shadow-sm"
              >
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
