import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Aksh Health — Healthcare OS",
    template: "%s | Aksh Health",
  },
  description:
    "Aksh Health is the AI Healthcare Operating System — the intelligence layer connecting EMIS, SystmOne, Epic, and NHS infrastructure to specialist AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
