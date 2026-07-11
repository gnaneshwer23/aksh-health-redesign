"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useIcsData } from "./IcsDataContext";
import { ChartSkeleton, RISK_COLORS } from "./shared";

export function PopulationCharts() {
  const { data, loading, liveData } = useIcsData();

  const pieData = [
    { name: "Low", value: data.riskDistribution.low },
    { name: "Medium", value: data.riskDistribution.medium },
    { name: "High", value: data.riskDistribution.high },
    { name: "Very High", value: data.riskDistribution.veryHigh },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Patient Risk Profile Across ICS</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {loading && !liveData ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={RISK_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Condition Prevalence vs Deprivation</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {loading && !liveData ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.conditionPrevalenceByIMD}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quintile" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="t2d" fill="#003D7A" name="T2D" />
                <Bar dataKey="hypertension" fill="#006B4F" name="Hypertension" />
                <Bar dataKey="copd" fill="#38BDF8" name="COPD" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
        <p className="px-6 pb-4 text-xs text-muted">T2D prevalence 3.2× higher in Q1 vs Q5</p>
      </Card>
    </div>
  );
}
