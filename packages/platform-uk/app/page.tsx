import type { Metadata } from "next";
import dynamic from "next/dynamic";

const ProductLanding = dynamic(
  () => import("@/components/product/product-landing").then((module) => module.ProductLanding),
  {
    loading: () => (
      <div className="marketing-site flex min-h-screen items-center justify-center bg-surface">
        <p className="text-steel">Loading…</p>
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "Aksh Health | Clinical workflow. AI-structured. Clinician-owned.",
  description:
    "UK clinical AI workflow platform with FHIR R4 staging, human-in-the-loop review, and a synthetic-safe proof environment for GP practices.",
};

export default function HomePage() {
  return <ProductLanding />;
}
