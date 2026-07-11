"use client";

import { Area, AreaChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useIcsData } from "./IcsDataContext";
import { ChartSkeleton } from "./shared";

export function AdmissionForecast() {
  const { data, loading, liveData } = useIcsData();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm">ICS Admission Forecast (digital twin)</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading && !liveData ? (
          <ChartSkeleton height="h-72" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.admissionForecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="upper" stroke="none" fill="#003D7A" fillOpacity={0.1} />
              <Area type="monotone" dataKey="lower" stroke="none" fill="#FFFFFF" fillOpacity={1} />
              <Line type="monotone" dataKey="predicted" stroke="#003D7A" strokeWidth={2} name="Digital Twin" />
              <Line type="monotone" dataKey="historical" stroke="#718096" strokeDasharray="4 4" name="Historical" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
