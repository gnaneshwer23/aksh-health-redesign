import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"

export default function StubPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-16">
        <div className="text-center px-6">
          <h1 className="text-3xl font-bold text-navy mb-3">{title}</h1>
          <p className="text-steel">Coming soon.</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
