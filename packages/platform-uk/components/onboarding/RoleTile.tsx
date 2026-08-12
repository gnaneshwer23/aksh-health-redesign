"use client";

import {
  BarChart3,
  Building2,
  Check,
  HeartPulse,
  Microscope,
  Network,
  Pill,
  Stethoscope,
  User,
} from "lucide-react";

import type { RoleDefinition } from "@/lib/onboarding/roles";
import { cn } from "@/lib/utils";

const ICONS = {
  stethoscope: Stethoscope,
  "heart-pulse": HeartPulse,
  pill: Pill,
  building: Building2,
  network: Network,
  "chart-bar": BarChart3,
  user: User,
  microscope: Microscope,
} as const;

type RoleTileProps = {
  role: RoleDefinition;
  selected: boolean;
  onSelect: () => void;
};

export function RoleTile({ role, selected, onSelect }: RoleTileProps) {
  const Icon = ICONS[role.icon as keyof typeof ICONS] ?? User;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${role.label}. ${role.description}`}
      className={cn(
        "relative flex min-h-[8.5rem] min-w-0 w-full flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors duration-150",
        selected
          ? "border-foreground/40 bg-surface"
          : "border-border hover:border-foreground/25"
      )}
    >
      {selected ? (
        <span
          className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-sm bg-foreground text-background"
          aria-hidden
        >
          <Check className="h-3 w-3" />
        </span>
      ) : null}
      <Icon className="h-5 w-5 shrink-0 text-foreground/70" aria-hidden />
      <div className="min-w-0 pr-6">
        <p className="text-sm font-semibold leading-snug text-foreground sm:text-base">
          {role.label}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted sm:text-sm">
          {role.description}
        </p>
      </div>
    </button>
  );
}
