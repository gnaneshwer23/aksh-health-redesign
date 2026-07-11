import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import Footer from "@/components/marketing/Footer";
import Navbar from "@/components/marketing/Navbar";

type MarketingShellProps = {
  children: ReactNode;
  className?: string;
  overDarkHero?: boolean;
};

export function MarketingShell({ children, className, overDarkHero = false }: MarketingShellProps) {
  return (
    <div className={cn("marketing-site flex min-h-screen flex-col bg-surface", className)}>
      <Navbar overDarkHero={overDarkHero} />
      <div className="flex-1 pt-16">{children}</div>
      <Footer />
    </div>
  );
}
