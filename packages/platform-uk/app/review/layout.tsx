import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";

export default function ReviewLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
