"use client";

import { useEffect, useState } from "react";
import { getDemandForecast } from "@/lib/forecasting";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ForecastPage() {
  const [horizon, setHorizon] = useState(7);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      setData(await getDemandForecast(horizon, 50));
    } catch (e: any) {
      setErr(e?.detail || "Failed to load forecast");
    }
  }

  useEffect(() => { load(); }, [horizon]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Demand Forecast</h1>
          <p className="text-sm text-muted-foreground">
            Predicted demand from {data?.start_date || "—"} (PAID sales only)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={horizon === 1 ? "default" : "outline"} onClick={() => setHorizon(1)}>Tomorrow</Button>
          <Button variant={horizon === 7 ? "default" : "outline"} onClick={() => setHorizon(7)}>Next 7 Days</Button>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </div>
      </div>

      {err && <p className="text-sm text-destructive">{err}</p>}

      <Card>
        <CardHeader><CardTitle className="text-base">Predicted Menu Items</CardTitle></CardHeader>
        <CardContent className="p-0 border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Menu Item</TableHead>
                <TableHead className="text-right">Tomorrow</TableHead>
                <TableHead className="text-right">Next Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items?.map((r: any) => (
                <TableRow key={r.menu_item_id}>
                  <TableCell className="font-medium">{r.menu_item_name}</TableCell>
                  <TableCell className="text-right">{r.tomorrow}</TableCell>
                  <TableCell className="text-right">{r.next_7_days_total}</TableCell>
                </TableRow>
              ))}
              {!data?.items?.length && (
                <TableRow>
                  <TableCell colSpan={3} className="text-sm text-muted-foreground">
                    No forecast data (need PAID sales history or model/features mismatch).
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
