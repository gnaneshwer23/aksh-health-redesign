import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import Footer from "@/components/marketing/Footer";
import Navbar from "@/components/marketing/Navbar";
import { SkipToMain } from "@/components/marketing/SkipToMain";

type MarketingShellProps = {
  children: ReactNode;
  className?: string;
  overDarkHero?: boolean;
};

export function MarketingShell({ children, className, overDarkHero = false }: MarketingShellProps) {
  return (
    <div className={cn("marketing-site flex min-h-screen flex-col bg-surface", className)}>
      <SkipToMain />
      <Navbar overDarkHero={overDarkHero} />
      <main id="main-content" className={cn("flex-1", !overDarkHero && "pt-16")}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
