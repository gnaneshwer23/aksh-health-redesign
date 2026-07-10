"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CapacityForecastDay } from "@/lib/mock-data/types";

export function CapacityChart({ data }: { data: CapacityForecastDay[] }) {
  const [range, setRange] = useState<"7d" | "14d" | "30d">("14d");
  const days = range === "7d" ? 7 : range === "14d" ? 14 : 14;
  const chartData = data.slice(0, days).map((d) => ({
    ...d,
    day: d.day.slice(5),
  }));

  return (
    <div className="space-y-3">
      <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
        <TabsList>
          <TabsTrigger value="7d">7d</TabsTrigger>
          <TabsTrigger value="14d">14d</TabsTrigger>
          <TabsTrigger value="30d">30d</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="predictedAdmissions" stackId="1" stroke="#003D7A" fill="#003D7A" fillOpacity={0.3} name="Admissions" />
            <Area type="monotone" dataKey="predictedDischarges" stackId="2" stroke="#00A86B" fill="#00A86B" fillOpacity={0.3} name="Discharges" />
            <Line type="monotone" dataKey="netBedDemand" stroke="#E53E3E" strokeDasharray="4 4" name="Net demand" />
            <ReferenceLine y={10} stroke="#718096" strokeDasharray="2 2" label="Threshold" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
