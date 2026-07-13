import { PlatformHubVisual } from "@/components/marketing/OwkinVisuals";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

export default function VisionStatement() {
  return (
    <section className="owkin-vision" aria-label="Product vision">
      <div className="owkin-vision__visual" aria-hidden>
        <PlatformHubVisual idPrefix="vision" />
      </div>
      <div className={`${container} relative z-10 max-w-4xl text-center`}>
        <ScrollReveal>
          <p className="owkin-vision__statement">
            Our vision is a world where clinical paperwork is governed, and research is connected to care — without
            taking control from the clinician.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
