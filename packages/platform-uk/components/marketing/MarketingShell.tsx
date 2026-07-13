import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import Footer from "@/components/marketing/Footer";
import Navbar from "@/components/marketing/Navbar";
import { SkipToMain } from "@/components/marketing/SkipToMain";

type MarketingShellProps = {
  children: ReactNode;
  className?: string;
  /** Transparent navbar with light text over a dark navy hero */
  overDarkHero?: boolean;
  /** Transparent navbar with dark ink over a light editorial hero */
  overLightHero?: boolean;
};

export function MarketingShell({
  children,
  className,
  overDarkHero = false,
  overLightHero = false,
}: MarketingShellProps) {
  const overHero = overDarkHero || overLightHero;

  return (
    <div
      className={cn(
        "marketing-site flex min-h-screen flex-col overflow-x-hidden bg-surface",
        overLightHero && "marketing-site--editorial",
        className
      )}
    >
      <SkipToMain />
      <Navbar overDarkHero={overDarkHero} overLightHero={overLightHero} />
      <main id="main-content" className={cn("flex-1", !overHero && "pt-16")}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
