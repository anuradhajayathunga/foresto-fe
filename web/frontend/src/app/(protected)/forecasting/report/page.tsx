"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  Printer, 
  Filter, 
  MoreHorizontal, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  CloudSun, 
  Sun, 
  CloudRain 
} from "lucide-react";
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  ComposedChart, 
  Line, 
  Area 
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// --- MOCK DATA FOR REPORT ---
const reportData = [
  { date: "Oct 18", actual: 112000, predicted: 115000, low: 105000, high: 125000, weather: "sun", accuracy: 97 },
  { date: "Oct 19", actual: 128000, predicted: 125000, low: 115000, high: 135000, weather: "sun", accuracy: 98 },
  { date: "Oct 20", actual: 145000, predicted: 140000, low: 130000, high: 150000, weather: "cloud", accuracy: 96 },
  { date: "Oct 21", actual: 98000, predicted: 110000, low: 100000, high: 120000, weather: "rain", accuracy: 89 },
  { date: "Oct 22", actual: 115000, predicted: 118000, low: 108000, high: 128000, weather: "cloud", accuracy: 97 },
  { date: "Oct 23", actual: 132000, predicted: 130000, low: 120000, high: 140000, weather: "sun", accuracy: 98 },
  { date: "Oct 24", actual: null, predicted: 145200, low: 135000, high: 155000, weather: "sun", accuracy: null }, // Today
  { date: "Oct 25", actual: null, predicted: 152000, low: 140000, high: 165000, weather: "sun", accuracy: null },
  { date: "Oct 26", actual: null, predicted: 160000, low: 148000, high: 172000, weather: "cloud", accuracy: null },
];

const WeatherIcon = ({ type }: { type: string }) => {
  if (type === "sun") return <Sun className="h-4 w-4 text-orange-500" />;
  if (type === "rain") return <CloudRain className="h-4 w-4 text-blue-500" />;
  return <CloudSun className="h-4 w-4 text-slate-500" />;
};

// Custom Tooltip for Chart
const ReportTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-border/60 p-3 rounded-lg shadow-xl text-xs min-w-[180px]">
        <p className="font-semibold text-foreground mb-2 pb-1 border-b border-border">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="flex items-center gap-1.5 text-muted-foreground capitalize">
              <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-foreground">
                {entry.value ? `LKR ${(entry.value / 1000).toFixed(1)}k` : "N/A"}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ForecastReportPage() {
  const [timeRange, setTimeRange] = useState("30d");

  return (
    <div className="flex flex-col min-h-screen bg-muted/5">
      
      {/* 1. REPORT HEADER */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight">Demand Forecast Report</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Generated Oct 24, 2025</span>
            <span>•</span>
            <span className="flex items-center gap-1">
               <CheckCircle2 className="h-3 w-3 text-emerald-500" />
               AI Model v2.4 (High Confidence)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="14d">Last 14 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last Quarter</SelectItem>
            </SelectContent>
          </Select>
          <div className="h-4 w-px bg-border mx-1" />
          <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button size="sm" className="h-8 gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-sm">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-[1600px] mx-auto w-full space-y-8">
        
        {/* 2. EXECUTIVE SUMMARY CARDS */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projected Revenue (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">LKR 985.4k</div>
              <div className="flex items-center text-xs mt-1 text-emerald-600 font-medium">
                <TrendingUp className="mr-1 h-3 w-3" />
                +12.5% vs last week
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Forecast Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">94.2%</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Mean Absolute Error: <span className="font-mono text-foreground">±4.1%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Predicted Cost of Goods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">LKR 315.2k</div>
              <div className="flex items-center text-xs mt-1 text-slate-500">
                <span className="font-medium text-foreground mr-1">32%</span> of revenue
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60 bg-orange-50/30 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-orange-700 dark:text-orange-400 uppercase tracking-wider">Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-orange-700 dark:text-orange-400">3 Items</div>
              <div className="mt-1 text-xs text-orange-600/80 dark:text-orange-400/80">
                Critical reorder needed today
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. ADVANCED VISUALIZATION */}
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Revenue Forecast & Confidence Interval</CardTitle>
                <CardDescription className="text-xs">
                  Showing predicted sales with AI confidence bounds (High/Low estimates)
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-orange-500"></span> Predicted
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-slate-900 dark:bg-slate-400"></span> Actual
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-orange-100 dark:bg-orange-900/30 border border-orange-200"></span> Range
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={reportData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={10} 
                    fontSize={11} 
                    tick={{ fill: '#64748b' }} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    fontSize={11} 
                    tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} 
                    tick={{ fill: '#64748b' }} 
                  />
                  <Tooltip content={<ReportTooltip />} cursor={{ stroke: '#f97316', strokeWidth: 1 }} />
                  
                  {/* Confidence Interval Area */}
                  <Area 
                    type="monotone" 
                    dataKey="high" 
                    data={reportData.map(d => ({ ...d, low: d.low }))} // Trick for range area if needed, or simple area
                    stroke="none"
                    fill="url(#colorConfidence)" 
                  />
                  
                  {/* Predicted Line */}
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#f97316" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6 }} 
                  />

                  {/* Actual Bars */}
                  <Bar 
                    dataKey="actual" 
                    barSize={20} 
                    fill="#0f172a" 
                    radius={[4, 4, 0, 0]} 
                    opacity={0.8}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 4. DETAILED BREAKDOWN TABLE */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base font-semibold">Daily Breakdown</CardTitle>
              <CardDescription className="text-xs">Detailed metrics per day including weather impact analysis.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
              <Filter className="h-3.5 w-3.5" /> Filter Columns
            </Button>
          </CardHeader>
          <div className="border-t border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 text-xs uppercase tracking-wider">
                  <TableHead className="pl-6 h-10 w-[150px]">Date</TableHead>
                  <TableHead className="h-10 w-[100px]">Weather</TableHead>
                  <TableHead className="text-right h-10">Predicted Rev.</TableHead>
                  <TableHead className="text-right h-10">Actual Rev.</TableHead>
                  <TableHead className="text-right h-10">Variance</TableHead>
                  <TableHead className="text-right h-10">Confidence</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row, i) => {
                  const variance = row.actual ? ((row.actual - row.predicted) / row.predicted * 100) : 0;
                  const isToday = row.date === "Oct 24"; // Mock logic

                  return (
                    <TableRow key={i} className={cn("group hover:bg-muted/30 transition-colors", isToday && "bg-orange-50/30 hover:bg-orange-50/50")}>
                      <TableCell className="pl-6 font-medium text-sm">
                        <div className="flex items-center gap-2">
                          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                          {row.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs capitalize">
                          <WeatherIcon type={row.weather} />
                          {row.weather}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        LKR {row.predicted.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {row.actual ? `LKR ${row.actual.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.actual ? (
                          <Badge variant="outline" className={cn(
                            "font-mono text-[10px] border-0",
                            Math.abs(variance) < 5 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          )}>
                            {variance > 0 ? "+" : ""}{variance.toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                         </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>

      </main>
    </div>
  );
}