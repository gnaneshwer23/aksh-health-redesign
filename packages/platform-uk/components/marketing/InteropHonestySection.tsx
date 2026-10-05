import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

export default function InteropHonestySection() {
  return (
    <section
      className="owkin-interop-honesty bg-[var(--owkin-cream,#fcfcfd)]"
      aria-labelledby="interop-honesty-heading"
      data-section="10"
    >
      <div className={`${container} py-16 md:py-20`}>
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="owkin-roles__eyebrow">Designed to sit beside your existing systems</p>
          <h2 id="interop-honesty-heading" className="owkin-whats-new__title">
            Your EHR stays your EHR.
          </h2>
          <p className="owkin-one-platform__lede mx-auto mt-4">
            Existing EHR context → Aksh clinical intelligence → human review → FHIR R4 staging → governed exchange.
          </p>
        </ScrollReveal>

        <ScrollReveal delayMs={60} className="aksh-interop-chain mt-10">
          {["Existing EHR context", "Aksh Health", "Human review", "FHIR R4 staging", "Governed exchange"].map(
            (label, index, arr) => (
              <div key={label} className="aksh-interop-chain__item">
                <span className="aksh-interop-chain__card">{label}</span>
                {index < arr.length - 1 ? <span className="aksh-interop-chain__arrow" aria-hidden>→</span> : null}
              </div>
            )
          )}
        </ScrollReveal>

        <p className="owkin-one-platform__lede mx-auto mt-8 max-w-2xl text-center text-sm">
          EHR examples shown for architectural context. Production connectivity depends on deployment configuration and
          organisational approval. Not a live EMR write in the public build.
        </p>
      </div>
    </section>
  );
}
