import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Building2, HeartHandshake, Pill, Stethoscope } from "lucide-react";

type Audience = {
  who: string;
  icon: LucideIcon;
  need: string;
  gets: string[];
  cta: { label: string; href: string };
  more: string;
};

const AUDIENCES: Audience[] = [
  {
    who: "Physicians & nurses",
    icon: Stethoscope,
    need: "Less admin, the full diabetes picture before every review.",
    gets: ["Drafted notes and coding", "Risk with its reasons", "Accept, edit or reject"],
    cta: { label: "Open the clinician demo", href: "/dashboard/gp" },
    more: "/for-clinicians",
  },
  {
    who: "People living with diabetes",
    icon: HeartHandshake,
    need: "Answers, bookings and check-ins without waiting on hold.",
    gets: ["Talk or type to Asha", "Readings reach your clinician", "A person for anything urgent"],
    cta: { label: "Talk to Asha", href: "/asha" },
    more: "/for-patients",
  },
  {
    who: "Pharmacists",
    icon: Pill,
    need: "Medication risks surfaced early, decisions on record.",
    gets: ["Interaction and allergy holds", "Medication review queue", "Rationale kept for audit"],
    cta: { label: "See the pharmacy step", href: "/demo/patel" },
    more: "/for-pharmacists",
  },
  {
    who: "Clinics, health systems & payers",
    icon: Building2,
    need: "Care gaps closed across a population, with evidence.",
    gets: ["Registry ranked by risk", "Care teams across organisations", "Outcomes against a locked baseline"],
    cta: { label: "Explore the care network", href: "/dashboard/network" },
    more: "/for-organisations",
  },
];

export default function LvAudiences() {
  return (
    <section className="lv-section" aria-labelledby="lv-audiences-title" data-section="audiences">
      <div className="lv-container">
        <div className="lv-section-head">
          <div>
            <p className="lv-eyebrow">Who it is for</p>
            <h2 id="lv-audiences-title" className="lv-h2 mt-3">
              One diabetes care loop. Everyone in it.
            </h2>
          </div>
          <p className="lv-lede">
            For any care team and any person with diabetes, in any market. Each role sees only what it is authorised to
            see; every clinical step waits for a named clinician.
          </p>
        </div>

        <ul className="lv-aud">
          {AUDIENCES.map((a) => {
            const Icon = a.icon;
            return (
              <li key={a.who} className="lv-aud__card">
                <span className="lv-aud__icon" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="lv-aud__who">{a.who}</h3>
                <p className="lv-aud__need">{a.need}</p>
                <ul className="lv-aud__gets">
                  {a.gets.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
                <div className="lv-aud__actions">
                  <Link href={a.cta.href} className="lv-aud__cta lv-focus">
                    {a.cta.label}
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link href={a.more} className="lv-aud__more lv-focus" aria-label={`Learn more: ${a.who}`}>
                    Learn more
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
