/**
 * Organisation clinical targets: the parameters of registered rules (lib/rules/registry.ts) that an organisation sets
 * to match the guideline it follows. Chosen from fixed options in organisation settings (stored in the organisation's
 * locale), never free text; the default applies until an administrator chooses. Every flag that uses a target says
 * which value applied and whether it was the organisation's choice or the default.
 */
export type TargetKey = "ldlWatchMmol" | "hba1cTargetMmol";

export type TargetDefinition = {
  key: TargetKey;
  label: string;
  unit: string;
  /** Allowed values, as stored (strings in the locale). */
  options: { value: string; note: string }[];
  defaultValue: string;
  ruleId: string;
};

export const ORG_TARGETS: Record<TargetKey, TargetDefinition> = {
  ldlWatchMmol: {
    key: "ldlWatchMmol",
    label: "LDL cholesterol level that raises a cardiovascular watch flag",
    unit: "mmol/L",
    options: [
      { value: "1.4", note: "very high cardiovascular risk goals (for example ESC/EAS)" },
      { value: "1.8", note: "high-risk goals in several diabetes and cardiology guidelines" },
      { value: "2.6", note: "a widely used upper goal (Aksh default)" },
      { value: "3.0", note: "lower-risk adults in some national guidance" },
    ],
    defaultValue: "2.6",
    ruleId: "lipids.ldl_watch",
  },
  hba1cTargetMmol: {
    key: "hba1cTargetMmol",
    label: "HbA1c counted as at target",
    unit: "mmol/mol",
    options: [
      { value: "48", note: "6.5%: tighter goal where safe" },
      { value: "53", note: "7%: common goal for many adults (Aksh default)" },
      { value: "58", note: "7.5%: some national guidance when treatment can cause hypoglycaemia" },
      { value: "64", note: "8%: less stringent goal for frailty or limited life expectancy" },
    ],
    defaultValue: "53",
    ruleId: "hba1c.target",
  },
};

export type OrgTargets = { ldlWatchMmol: number; hba1cTargetMmol: number; chosen: Record<TargetKey, boolean> };

/** The organisation's targets from its locale; the default for any target it has not chosen (or set to an unknown value). */
export function orgTargets(locale: Record<string, unknown> | null | undefined): OrgTargets {
  const pick = (k: TargetKey) => {
    const v = typeof locale?.[k] === "string" ? (locale[k] as string) : undefined;
    const ok = v !== undefined && ORG_TARGETS[k].options.some((o) => o.value === v);
    return { value: Number(ok ? v : ORG_TARGETS[k].defaultValue), chosen: ok };
  };
  const ldl = pick("ldlWatchMmol");
  const a1c = pick("hba1cTargetMmol");
  return { ldlWatchMmol: ldl.value, hba1cTargetMmol: a1c.value, chosen: { ldlWatchMmol: ldl.chosen, hba1cTargetMmol: a1c.chosen } };
}

export const DEFAULT_TARGETS = orgTargets(null);
