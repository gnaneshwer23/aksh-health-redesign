import Link from "next/link";

import { SiteShell } from "@/components/site/SiteShell";

export default function NotFound() {
  return (
    <SiteShell>
      <section className="s-section">
        <div className="s-container" style={{ display: "grid", gap: 18, justifyItems: "center", textAlign: "center" }}>
          <span className="s-eyebrow">404</span>
          <h1 className="s-h2">This page does not exist.</h1>
          <p className="s-lede">It may have moved. These will get you back on track.</p>
          <div className="s-actions" style={{ justifyContent: "center" }}>
            <Link href="/" className="s-btn s-btn--primary">Home</Link>
            <Link href="/product" className="s-btn s-btn--ghost">Product</Link>
            <Link href="/resources" className="s-btn s-btn--ghost">Resources</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
