"use client";

import { useEffect, useMemo, useState } from "react";
import { getForecastHistory } from "@/lib/forecasting";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function ForecastDashboard() {
  const [data, setData] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    (async () => {
      const d = await getForecastHistory(14, 50);
      setData(d);
      if (d.items?.length) setSelectedId(String(d.items[0].menu_item_id));
    })();
  }, []);

  const selected = useMemo(() => {
    if (!data?.items?.length) return null;
    return data.items.find((x: any) => String(x.menu_item_id) === selectedId) || data.items[0];
  }, [data, selectedId]);

  const yesterdayTotals = useMemo(() => {
    if (!data?.items) return { actual: 0, pred: 0, diff: 0 };
    const actual = data.items.reduce((s: number, x: any) => s + (x.yesterday_actual || 0), 0);
    const pred = data.items.reduce((s: number, x: any) => s + (x.yesterday_pred || 0), 0);
    return { actual, pred, diff: actual - pred };
  }, [data]);

  const chartData = useMemo(() => {
    if (!selected?.daily) return [];
    return selected.daily.map((d: any) => ({
      date: d.date.slice(5), // MM-DD
      Actual: d.actual,
      Predicted: d.yhat,
      Diff: d.actual - d.yhat,
    }));
  }, [selected]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Forecast Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Yesterday: actual vs predicted • {data?.start_date} → {data?.end_date}
        </p>
      </div>

      {/* Yesterday summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Yesterday Actual (All Items)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{yesterdayTotals.actual}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Yesterday Predicted (All Items)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{yesterdayTotals.pred}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Yesterday Difference</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{yesterdayTotals.diff}</CardContent>
        </Card>
      </div>

      {/* Item selector + chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Daily Sales vs Prediction</CardTitle>

          <div className="w-[260px]">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Select menu item" />
              </SelectTrigger>
              <SelectContent>
                {data?.items?.map((x: any) => (
                  <SelectItem key={x.menu_item_id} value={String(x.menu_item_id)}>
                    {x.menu_item_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Actual" dot={false} />
              <Line type="monotone" dataKey="Predicted" dot={false} />
              <Line type="monotone" dataKey="Diff" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Yesterday per-item table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yesterday Per Item</CardTitle>
        </CardHeader>
        <CardContent className="p-0 border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Predicted</TableHead>
                <TableHead className="text-right">Diff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items?.map((x: any) => (
                <TableRow key={x.menu_item_id}>
                  <TableCell className="font-medium">{x.menu_item_name}</TableCell>
                  <TableCell className="text-right">{x.yesterday_actual}</TableCell>
                  <TableCell className="text-right">{x.yesterday_pred}</TableCell>
                  <TableCell className="text-right">{x.yesterday_diff}</TableCell>
                </TableRow>
              ))}
              {!data?.items?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">
                    No data (need PAID sales history).
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
