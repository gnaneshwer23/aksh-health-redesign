"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { integrationServices } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function IntegrationStatus() {
  const [loading, setLoading] = useState(false);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <CardTitle className="text-sm">Integration Status</CardTitle>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 800); }} disabled={loading}>
          <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {integrationServices.map((svc) => (
          <div key={svc.name} className="flex items-center justify-between text-xs border-b border-border py-2 last:border-0">
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", svc.status === "Healthy" ? "bg-accent" : "bg-warning")} />
              <span className="font-medium">{svc.name}</span>
            </div>
            <div className="text-right text-muted">
              <p>{svc.status}</p>
              <p className="text-[10px]">{svc.lastSync} · {svc.latencyMs}ms</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
