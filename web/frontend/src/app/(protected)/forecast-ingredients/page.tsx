"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getIngredientPlan, type IngredientPlan } from "@/lib/forecasting";
import { createPurchaseDraftFromForecast, listSuppliers, type Supplier } from "@/lib/purchases";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function StatusBadge({ s }: { s: "OK" | "LOW" | "OUT" }) {
  if (s === "OUT") return <Badge variant="destructive">OUT</Badge>;
  if (s === "LOW") return <Badge variant="secondary">LOW</Badge>;
  return <Badge>OK</Badge>;
}

export default function ForecastIngredientsPage() {
  const router = useRouter();

  const [scope, setScope] = useState<"tomorrow" | "next7">("next7");
  const [data, setData] = useState<IngredientPlan | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [draftOpen, setDraftOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(todayISO());
  const [note, setNote] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const d = await getIngredientPlan(scope, 7, 200);
      setData({ ...d, scope: scope as "tomorrow" | "next7" });
    } catch (e: any) {
      setErr(e?.detail || "Failed to load ingredient plan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [scope]);

  useEffect(() => {
    (async () => {
      try {
        const s = await listSuppliers();
        setSuppliers(s);
        if (s.length && !supplierId) setSupplierId(String(s[0].id));
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const ings = data?.ingredients || [];
    const out = ings.filter((x) => x.status === "OUT").length;
    const low = ings.filter((x) => x.status === "LOW").length;
    const ok = ings.filter((x) => x.status === "OK").length;
    return { out, low, ok, total: ings.length };
  }, [data]);

  async function createDraft() {
    if (!supplierId) {
      setErr("Please select a supplier.");
      return;
    }

    setCreating(true);
    setErr(null);
    try {
      const inv = await createPurchaseDraftFromForecast({
        supplier: Number(supplierId),
        scope,
        horizon_days: 7,
        top_n: 200,
        include_ok: false,
        invoice_date: invoiceDate,
        note: note || `Auto draft from forecast (${scope})`,
      });

      setDraftOpen(false);
      router.push(`/purchases/${inv.id}`);
    } catch (e: any) {
      setErr(e?.detail || "Failed to create purchase draft");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ingredient Suggestions</h1>
          <p className="text-sm text-muted-foreground">
            Based on predicted sales ({scope}) starting {data?.start_date || "—"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={scope === "tomorrow" ? "default" : "outline"} onClick={() => setScope("tomorrow")}>
            Tomorrow
          </Button>
          <Button variant={scope === "next7" ? "default" : "outline"} onClick={() => setScope("next7")}>
            Next 7 Days
          </Button>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>

          <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
            <DialogTrigger asChild>
              <Button>Create Purchase Draft</Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Purchase Draft from Forecast</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {suppliers.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No suppliers found. Create suppliers first.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Invoice date</Label>
                  <input
                    type="date"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Note (optional)</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={`Auto draft from forecast (${scope})`}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  This creates a draft invoice using the suggested purchase quantities. Stock will not change until posted.
                </p>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDraftOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createDraft} disabled={creating || suppliers.length === 0}>
                    {creating ? "Creating..." : "Create Draft"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {err && <p className="text-sm text-destructive">{err}</p>}

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Ingredients</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.total}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">OK</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.ok}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">LOW</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.low}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">OUT</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.out}</CardContent>
        </Card>
      </div>

      {data?.items_missing_recipes?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Missing Recipes</CardTitle>
            <CardDescription>
              These have predicted demand but no recipe lines, so ingredient usage can’t be calculated.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="list-disc pl-5 space-y-1">
              {data.items_missing_recipes.map((x) => (
                <li key={x.menu_item_id}>{x.menu_item_name}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchase Suggestions</CardTitle>
          <CardDescription>
            Suggested purchase keeps projected remaining stock at least reorder level.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Required</TableHead>
                <TableHead className="text-right">Projected</TableHead>
                <TableHead className="text-right">Reorder</TableHead>
                <TableHead className="text-right">Suggest Buy</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data?.ingredients?.map((x) => (
                <TableRow key={x.ingredient_id}>
                  <TableCell className="font-medium">
                    {x.ingredient_name}{" "}
                    <span className="text-xs text-muted-foreground">({x.unit})</span>
                  </TableCell>
                  <TableCell>{x.sku}</TableCell>
                  <TableCell><StatusBadge s={x.status} /></TableCell>
                  <TableCell className="text-right">{x.current_stock}</TableCell>
                  <TableCell className="text-right">{x.required_qty}</TableCell>
                  <TableCell className="text-right">{x.projected_remaining}</TableCell>
                  <TableCell className="text-right">{x.reorder_level}</TableCell>
                  <TableCell className="text-right font-semibold">{x.suggested_purchase_qty}</TableCell>
                </TableRow>
              ))}

              {!data?.ingredients?.length && (
                <TableRow>
                  <TableCell colSpan={8} className="text-sm text-muted-foreground">
                    No ingredient plan available (need recipes + inventory items + PAID sales history).
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
