import { ProductDemoScript } from "@/components/product/product-demo-script";

export const metadata = {
  title: "Product demo walkthrough | Aksh Health",
  description: "Controlled product demo stops for advisors and partners (synthetic proof boundary)."
};

/** Legacy advisor walkthrough — for Capture→export clinical script use /demo/script */
export default function ProductDemoPage() {
  return <ProductDemoScript />;
}
