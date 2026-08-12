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
        "relative flex min-h-[8.5rem] min-w-0 w-full flex-col items-start gap-3 rounded-3xl border bg-card p-5 text-left transition-all duration-150",
        selected
          ? "border-accent/35 bg-pastel-mint shadow-soft"
          : "border-border-subtle hover:border-accent/25 hover:shadow-card"
      )}
    >
      {selected ? (
        <span
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white"
          aria-hidden
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      ) : null}
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-accent">
        <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 pr-6">
        <p className="font-display text-sm font-semibold leading-snug text-foreground sm:text-base">
          {role.label}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted sm:text-sm">
          {role.description}
        </p>
      </div>
    </button>
  );
}
