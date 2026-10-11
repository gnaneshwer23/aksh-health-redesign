import type { Metadata } from "next";

import { SiteShell } from "@/components/site/SiteShell";
import { AshaConversation } from "@/components/front-desk/AshaConversation";

export const metadata: Metadata = {
  title: "Talk to Asha | Aksh Health",
  description:
    "Asha is the practice's automated assistant: book, move or cancel appointments, share readings and symptoms for your care team, or ask a practice question. Synthetic demo, no medical advice.",
};

export default function AshaPage() {
  return (
    <SiteShell>
      <section className="lv-book" aria-labelledby="asha-title">
        <div className="lv-container">
          <p className="lv-eyebrow">Patient support · synthetic demo</p>
          <h1 id="asha-title" className="lv-h2 mt-3">
            Talk to Asha.
          </h1>
          <p className="lv-lede mt-4">
            Asha answers the practice phone and calls patients back. Book, move or cancel an appointment, tell Asha your
            readings and how you’re feeling for your care team, or ask a question about the practice. A GP reviews anything
            clinical. Asha never gives medical advice, and anything urgent goes straight to a person.
          </p>
          <div className="mt-8">
            <AshaConversation />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
