import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type MarketingSectionHeaderProps = {
  label: string;
  title: string;
  description?: string;
  link?: { href: string; label: string };
  align?: "center" | "left" | "split";
  className?: string;
};

export function MarketingSectionHeader({
  label,
  title,
  description,
  link,
  align = "center",
  className,
}: MarketingSectionHeaderProps) {
  const isSplit = align === "split";
  const isCenter = align === "center";

  return (
    <div
      className={cn(
        "mb-12 md:mb-14",
        isSplit && "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        isCenter && "text-center",
        align === "left" && "max-w-2xl text-left",
        className
      )}
    >
      <div className={cn(isCenter && "mx-auto max-w-2xl")}>
        <p className="marketing-section-label mb-3">{label}</p>
        <h2
          className={cn(
            "text-3xl font-bold tracking-tight text-navy md:text-4xl",
            isCenter && "mx-auto",
            align === "left" && "max-w-lg leading-[1.15]"
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className={cn("mt-3 text-lg text-steel", isCenter && "mx-auto max-w-2xl")}>{description}</p>
        ) : null}
      </div>

      {link ? (
        <Link
          href={link.href}
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-full border border-navy/15 bg-white px-6 py-3 text-sm font-semibold text-navy shadow-sm transition-all hover:-translate-y-0.5 hover:border-navy/30",
            isCenter && "mx-auto",
            isSplit && "shrink-0"
          )}
        >
          {link.label}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
