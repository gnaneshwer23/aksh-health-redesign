import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Akeno Health Platform",
  description: "Multi-AMC learning health system control plane",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
