"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-200 ${
      scrolled ? "bg-white/95 backdrop-blur border-b border-border shadow-sm" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-navy text-base leading-none">Aksh Health</span>
            <span className="text-emerald text-[10px] font-medium leading-none">Healthcare OS</span>
          </div>
        </Link>

        {/* Nav Links - desktop */}
        <div className="hidden md:flex items-center gap-8">
          {[
            ["Platform", "/platform"],
            ["For Clinicians", "/for-clinicians"],
            ["For Hospitals", "/for-hospitals"],
            ["For Patients", "/for-patients"],
            ["Docs", "/docs"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className={`text-sm font-medium transition-colors ${
                scrolled ? "text-slate hover:text-navy" : "text-white/90 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className={`hidden md:block text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
              scrolled
                ? "border-navy text-navy hover:bg-navy hover:text-white"
                : "border-white/60 text-white hover:border-white"
            }`}
          >
            Sign In
          </Link>
          <Link
            href="/pilot"
            className="text-sm font-bold px-5 py-2 rounded-lg bg-white text-navy hover:bg-white/90 transition-colors shadow-sm"
          >
            Request Pilot
          </Link>
        </div>
      </div>
    </nav>
  )
}
