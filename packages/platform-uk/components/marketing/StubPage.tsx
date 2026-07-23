import Footer from "@/components/marketing/Footer";
import Navbar from "@/components/marketing/Navbar";

export default function StubPage({ title }: { title: string }) {
  return (
    <div className="marketing-site flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="flex flex-1 items-center justify-center pt-16">
        <div className="px-6 text-center">
          <h1 className="mb-3 text-3xl font-bold text-navy">{title}</h1>
          <p className="text-steel">This page is being prepared.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
