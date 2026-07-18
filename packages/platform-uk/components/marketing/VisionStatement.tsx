import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

export default function VisionStatement() {
  return (
    <section className="owkin-vision" aria-label="Product vision">
      <div className="owkin-vision__wash" aria-hidden />
      <div className={`${container} relative z-10 max-w-4xl text-center`}>
        <ScrollReveal>
          <p className="owkin-vision__statement">
            Our vision is governed care coordination today — Capture → draft → approve with the clinician in control —
            and an honest path toward Precision Health scaffolding, without claiming a living twin or live EMR write-back.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
