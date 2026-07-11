import Link from "next/link";

import { ProductDemoScript } from "@/components/product/product-demo-script";

export default function DemoPage() {
  return (
    <main className="stack">
      <section className="panel stack" style={{ margin: "1rem" }}>
        <p className="gp-panel__eyebrow">Phase C · Overview Demo</p>
        <h1>Demo entry points</h1>
        <div className="actions">
          <Link className="button primary" href="/demo/patel">
            Patel walkthrough launcher (~25 min)
          </Link>
          <Link className="button secondary" href="/demo/voice-care-day3">
            Voice Care Day 3
          </Link>
        </div>
      </section>
      <ProductDemoScript />
    </main>
  );
}
