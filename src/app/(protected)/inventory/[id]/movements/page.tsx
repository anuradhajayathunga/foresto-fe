"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { listStockMovements, StockMovement } from "@/lib/inventory";

import {
  ArrowLeft,
  Calendar,
  TrendingDown,
  TrendingUp,
  User,
  ArrowRightLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function MovementsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const itemId = Number(params.id);

  const [rows, setRows] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listStockMovements(itemId);
        setRows(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [itemId]);

  // --- Analytics / Value Calculation ---
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    rows.forEach((r) => {
      const q = Number(r.quantity) || 0;
      if (r.movement_type === "IN") totalIn += q;
      else if (r.movement_type === "OUT") totalOut += q;
    });

    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [rows]);

  return (
    <div className="space-y-6 p-2 sm:p-4">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/inventory")}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight">
            Movement History
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Product SKU/ID:</span>
            <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">
              {itemId}
            </code>
          </div>
        </div>
      </div>

      <Separator />

      {/* ANALYTICS CARDS - The "Value" Feature */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Received
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{stats.totalIn}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime Stock In</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Dispatched
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{stats.totalOut}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime Stock Out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.net > 0 ? "+" : ""}
              {stats.net}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall Volume Delta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DATA TABLE */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Reason / Reference</TableHead>
              <TableHead className="text-right">Action By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading history...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No stock movements recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleTimeString(
                              undefined,
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "--:--"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.movement_type === "IN" ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      >
                        <TrendingUp className="mr-1 h-3 w-3" /> Stock In
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      >
                        <TrendingDown className="mr-1 h-3 w-3" /> Stock Out
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono font-medium ${
                      r.movement_type === "IN"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {r.movement_type === "IN" ? "+" : "-"}
                    {r.quantity}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate text-sm">
                      {r.reason || (
                        <span className="text-muted-foreground italic">
                          No reason provided
                        </span>
                      )}
                    </div>
                    {/* Optionally display r.note if it exists in your data structure */}
                    {/* {r.note && <div className="text-xs text-muted-foreground truncate">{r.note}</div>} */}
                  </TableCell>
                  <TableCell className="flex justify-end">
                    <div className="flex items-center gap-2">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-medium">
                          {r.created_by_email?.split("@")[0] || "System"}
                        </div>
                      </div>
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback className="bg-muted text-[10px]">
                          {r.created_by_email ? (
                            r.created_by_email.substring(0, 2).toUpperCase()
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
