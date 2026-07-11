"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";

import { useIcsData } from "./IcsDataContext";
import { ChartSkeleton } from "./shared";

export function EquityDeepDive() {
  const { data, loading, liveData } = useIcsData();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm">EQUITY Deep-Dive</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !liveData ? (
          <ChartSkeleton height="h-40" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Practice</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.equityDeepDive.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.flagCount}</TableCell>
                    <TableCell>{row.practice}</TableCell>
                    <TableCell>{row.recommendedAction}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => toast({ title: "Equity action plan generated" })}
            >
              Generate Equity Action Plan
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
