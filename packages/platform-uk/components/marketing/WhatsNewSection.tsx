import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const roles = [
  "01  GP · clinical review and documentation",
  "02  Nurse / care coordinator",
  "03  Clinical pharmacist",
  "04  Practice administrator",
  "05  Regional / population lead",
  "06  Hospital executive",
  "07  Patient (clinic-invited)",
  "08  Researcher / analyst",
] as const;

/** One platform value statement — replaces tabbed platform highlights. */
export default function WhatsNewSection() {
  return (
    <section className="owkin-whats-new owkin-one-platform" aria-labelledby="one-platform-heading" data-section="07">
      <div className={`${container} owkin-one-platform__grid`}>
        <ScrollReveal className="owkin-one-platform__copy">
          <p className="owkin-roles__eyebrow">One platform</p>
          <h2 id="one-platform-heading" className="owkin-whats-new__title">
            Purpose-built for every
            <span className="block">role in the care team.</span>
          </h2>
          <p className="owkin-one-platform__lede">
            The same coordination layer — different work. GPs review clinical drafts. Nurses manage handovers and
            observations. Pharmacists check interactions. Administrators monitor governance. Regional leads see population
            signals. Each role sees what it needs. Nothing it does not.
          </p>
        </ScrollReveal>

        <ScrollReveal delayMs={80}>
          <ol className="owkin-one-platform__list" aria-label="Eight roles on the platform">
            {roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ol>
        </ScrollReveal>
      </div>
    </section>
  );
}
