import type { Metadata } from "next";

import LvAudiencePage from "@/components/marketing/lavender/LvAudiencePage";
import { AUDIENCE_PAGES } from "@/components/marketing/lavender/audience-pages";

const page = AUDIENCE_PAGES.pharmacists;

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: { canonical: page.path },
};

export default function Page() {
  return <LvAudiencePage audience="pharmacists" />;
}
