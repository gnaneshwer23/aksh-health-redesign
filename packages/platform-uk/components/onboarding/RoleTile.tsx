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
      className={cn(
        "relative flex w-full flex-col items-start gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm transition-all duration-200 hover:border-medicom-navy/40",
        selected
          ? "border-medicom-navy ring-2 ring-medicom-navy/20"
          : "border-border"
      )}
    >
      {selected ? (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-medicom-emerald text-white">
          <Check className="h-3 w-3" aria-hidden />
        </span>
      ) : null}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: role.color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{role.label}</p>
        <p className="mt-1 text-sm text-muted">{role.description}</p>
      </div>
    </button>
  );
}
