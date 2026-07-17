import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import Footer from "@/components/marketing/Footer";
import { MarketingChatWidget } from "@/components/marketing/MarketingChatWidget";
import Navbar from "@/components/marketing/Navbar";
import { SkipToMain } from "@/components/marketing/SkipToMain";

type MarketingShellProps = {
  children: ReactNode;
  className?: string;
  /** Cream Owkin marketing system (inner pages with solid nav) */
  editorial?: boolean;
  /** Transparent navbar with light text over a dark navy hero */
  overDarkHero?: boolean;
  /** Transparent navbar with dark ink over a light editorial hero */
  overLightHero?: boolean;
  /** Floating Ask widget (hidden on dedicated /chat page) */
  showChatWidget?: boolean;
};

export function MarketingShell({
  children,
  className,
  editorial = false,
  overDarkHero = false,
  overLightHero = false,
  showChatWidget = true,
}: MarketingShellProps) {
  const overHero = overDarkHero || overLightHero;
  const useEditorial = editorial || overLightHero;

  return (
    <div
      className={cn(
        "marketing-site flex min-h-screen flex-col overflow-x-hidden bg-surface",
        useEditorial && "marketing-site--editorial",
        className
      )}
    >
      <SkipToMain />
      <Navbar overDarkHero={overDarkHero} overLightHero={overLightHero} />
      <main id="main-content" className={cn("flex-1", !overHero && "pt-16")}>
        {children}
      </main>
      <Footer />
      {showChatWidget ? <MarketingChatWidget /> : null}
    </div>
  );
}
