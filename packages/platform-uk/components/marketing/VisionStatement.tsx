import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

export default function VisionStatement() {
  return (
    <section className="owkin-vision" aria-label="Product vision">
      <div className="owkin-vision__wash" aria-hidden />
      <div className={`${container} relative z-10 max-w-3xl text-center`}>
        <ScrollReveal>
          <h2 className="owkin-vision__headline mb-4 font-[family-name:var(--font-marketing-display)] text-[clamp(1.65rem,3vw,2.35rem)] font-semibold tracking-tight text-[var(--mk-ink)]">
            Every clinical decision deserves context.
          </h2>
          <p className="owkin-vision__statement">
            Clinical work lives across multiple systems. Aksh Health brings consultations, referrals, medications,
            safety checks, and governance into one coordinated workflow while keeping clinicians in control.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
