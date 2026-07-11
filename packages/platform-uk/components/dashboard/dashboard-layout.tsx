/**
 * @deprecated Legacy Phase B shell — superseded by `DashboardShell` + role layouts.
 * No active imports remain; kept for reference during migration. Do not use in new code.
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { DASHBOARD_LABELS } from "@/lib/compliance-labels";

export function DashboardLayout({
  role,
  title,
  description,
  children
}: {
  role: keyof typeof DASHBOARD_LABELS;
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  const nav = [
    { href: "/dashboard/gp", label: DASHBOARD_LABELS.clinician },
    { href: "/dashboard/nurse", label: DASHBOARD_LABELS.nurse },
    { href: "/dashboard/pharmacist", label: DASHBOARD_LABELS.pharmacist },
    { href: "/dashboard/admin", label: DASHBOARD_LABELS.admin },
    { href: "/dashboard/regional", label: DASHBOARD_LABELS.regional }
  ];

  return (
    <div className="stack shell dashboard-shell">
      <header className="panel dashboard-shell__header">
        <div>
          <p className="gp-panel__eyebrow">Role dashboard · Phase B</p>
          <h1>{title ?? DASHBOARD_LABELS[role]}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        <nav aria-label="Role dashboards" className="dashboard-shell__nav">
          {nav.map((item) => (
            <Link className={item.href.includes(`/dashboard/${role === "clinician" ? "gp" : role}`) ? "is-active" : ""} href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
