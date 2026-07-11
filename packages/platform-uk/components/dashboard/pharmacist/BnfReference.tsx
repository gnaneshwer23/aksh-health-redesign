"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { bnfEntries } from "@/lib/mock-data";

const PHARMACIST_ACCENT = "text-[#6B46C1]";
const DEFAULT_RECENT = ["Apixaban", "Metformin", "Furosemide", "Amlodipine", "Sertraline"];

export function BnfReference() {
  const [bnfSearch, setBnfSearch] = useState("");
  const [recentBnf, setRecentBnf] = useState<string[]>(DEFAULT_RECENT);

  return (
    <section>
      <h2 className={`text-lg font-semibold mb-3 ${PHARMACIST_ACCENT}`}>BNF Reference</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm border-[#6B46C1]/10 p-4">
          <h3 className={`font-semibold text-sm mb-3 ${PHARMACIST_ACCENT}`}>BNF Search</h3>
          <Input placeholder="Search BNF..." value={bnfSearch} onChange={(e) => setBnfSearch(e.target.value)} />
          <div className="mt-3 space-y-2">
            {bnfEntries
              .filter((b) => !bnfSearch || b.name.toLowerCase().includes(bnfSearch.toLowerCase()))
              .map((b) => (
                <div
                  key={b.name}
                  className="text-xs border-b border-border py-2 cursor-pointer hover:bg-background"
                  onClick={() => setRecentBnf((r) => [b.name, ...r.filter((x) => x !== b.name)].slice(0, 5))}
                >
                  <p className="font-medium">{b.name}</p>
                  <p className="text-muted">{b.section}</p>
                  <p>{b.dosing}</p>
                </div>
              ))}
          </div>
        </Card>
        <Card className="shadow-sm border-[#6B46C1]/10 p-4">
          <h3 className={`font-semibold text-sm mb-3 ${PHARMACIST_ACCENT}`}>Recently Viewed</h3>
          <ul className="text-sm space-y-1">
            {recentBnf.map((r) => (
              <li key={r} className="text-[#6B46C1]/90">
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}
