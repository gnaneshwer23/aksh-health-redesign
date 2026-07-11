import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Aksh Health — Healthcare OS",
  description: "The AI Healthcare Operating System. Seven clinical AI agents. FHIR-native. Human-in-the-loop. Built for NHS.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-surface text-slate antialiased`}>
        {children}
      </body>
    </html>
  )
}
