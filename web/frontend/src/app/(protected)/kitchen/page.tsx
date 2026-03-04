"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchItems, type MenuItem } from "@/lib/menu";
import {
  listProductions,
  upsertProduction,
  forecastSuggestProductions,
  checkPlanAlerts,
  listWastes,
  upsertWaste,
  getWasteSummary,
  getWasteVsSales,
  listKitchenPurchaseRequests,
  submitKitchenPurchaseRequest,
  convertKitchenPurchaseRequestToDraft,
  type KitchenAlertData,
  type KitchenProduction,
  type KitchenWaste,
  type KitchenPurchaseRequest,
} from "@/lib/kitchen";
import { listSuppliers, type Supplier } from "@/lib/purchases";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChefHat,
  AlertTriangle,
  RefreshCw,
  CalendarRange,
  Trash2,
  ShoppingCart,
  TrendingUp,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

// --- Utilities ---
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function parseError(error: any): string {
  if (!error) return "Request failed.";
  if (typeof error === "string") return error;
  if (error.detail) return String(error.detail);
  const firstKey = Object.keys(error)[0];
  const value = firstKey ? error[firstKey] : null;
  if (Array.isArray(value) && value.length) return String(value[0]);
  if (typeof value === "string") return value;
  return "Request failed.";
}

function fmtQty(v: string | number | null | undefined) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

export default function KitchenPage() {
  const router = useRouter();

  // --- State ---
  const [items, setItems] = useState<MenuItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productions, setProductions] = useState<KitchenProduction[]>([]);
  const [wastes, setWastes] = useState<KitchenWaste[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<
    KitchenPurchaseRequest[]
  >([]);

  const [dateFrom, setDateFrom] = useState<string>(() => todayISO());
  const [dateTo, setDateTo] = useState<string>(() => tomorrowISO());

  // Production State
  const [prodDate, setProdDate] = useState<string>(() => todayISO());
  const [prodMenuItem, setProdMenuItem] = useState<string>("");
  const [plannedQty, setPlannedQty] = useState<string>("0");
  const [preparedQty, setPreparedQty] = useState<string>("0");
  const [prodNote, setProdNote] = useState<string>("");
  const [selectedProductionId, setSelectedProductionId] = useState<
    number | null
  >(null);

  // Forecast State
  const [forecastDate, setForecastDate] = useState<string>(() => tomorrowISO());
  const [forecastSave, setForecastSave] = useState<"yes" | "no">("yes");

  // Waste State
  const [wasteDate, setWasteDate] = useState<string>(() => todayISO());
  const [wasteMenuItem, setWasteMenuItem] = useState<string>("");
  const [wasteQty, setWasteQty] = useState<string>("");
  const [wasteReason, setWasteReason] = useState<
    "UNSOLD" | "BURNT" | "RETURNED" | "EXPIRED" | ""
  >("UNSOLD");
  const [wasteNote, setWasteNote] = useState<string>("");
  const [wasteSummary, setWasteSummary] = useState<{
    total_waste: string;
    by_reason: Array<{ reason: string; total_waste: string }>;
  } | null>(null);
  const [wasteVsSales, setWasteVsSales] = useState<
    Array<{
      menu_item_id: number;
      menu_item_name: string;
      sold_qty: string;
      waste_qty: string;
      waste_rate_pct: number;
    }>
  >([]);

  // UI State
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Conversion Dialog State
  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null,
  );
  const [convertSupplier, setConvertSupplier] = useState<string>("");
  const [convertDate, setConvertDate] = useState<string>(() => todayISO());
  const [convertInvoiceNo, setConvertInvoiceNo] = useState<string>("");
  const [convertNote, setConvertNote] = useState<string>("");

  // Low-stock alerts and purchase actions from production row
  const [planAlerts, setPlanAlerts] = useState<KitchenAlertData | null>(null);
  const [alertSupplier, setAlertSupplier] = useState<string>("");
  const [alertInvoiceDate, setAlertInvoiceDate] = useState<string>(() =>
    todayISO(),
  );
  const [alertInvoiceNo, setAlertInvoiceNo] = useState<string>("");
  const [alertNote, setAlertNote] = useState<string>(
    "Auto-created from kitchen low-stock check",
  );
  const [productionAlertCounts, setProductionAlertCounts] = useState<
    Record<number, number>
  >({});
  const [loadingAlertCounts, setLoadingAlertCounts] = useState<
    Record<number, boolean>
  >({});

  function getAlertCount(alerts?: KitchenAlertData | null) {
    return alerts?.ingredient_alerts?.length || 0;
  }

  async function loadProductionAlertCounts(rows: KitchenProduction[]) {
    if (!rows.length) {
      setProductionAlertCounts({});
      setLoadingAlertCounts({});
      return;
    }

    const loadingMap: Record<number, boolean> = {};
    rows.forEach((row) => {
      loadingMap[row.id] = true;
    });
    setLoadingAlertCounts(loadingMap);

    const settled = await Promise.allSettled(
      rows.map(async (row) => {
        const resp = await checkPlanAlerts({
          date: row.date,
          rows: [
            {
              menu_item_id: Number(row.menu_item),
              planned_qty: String(row.planned_qty || "0"),
            },
          ],
        });
        return { id: row.id, count: getAlertCount(resp.alerts) };
      }),
    );

    const nextCounts: Record<number, number> = {};
    settled.forEach((result) => {
      if (result.status === "fulfilled") {
        nextCounts[result.value.id] = result.value.count;
      }
    });
    setProductionAlertCounts(nextCounts);
    setLoadingAlertCounts({});
  }

  // --- Loaders ---
  async function loadBootstrap() {
    setLoading(true);
    setErr(null);
    try {
      const [menuData, supplierData] = await Promise.all([
        fetchItems({ is_available: "true" }),
        listSuppliers(),
      ]);
      setItems(menuData);
      setSuppliers(supplierData);
      if (menuData.length) {
        const first = String(menuData[0].id);
        if (!prodMenuItem) setProdMenuItem(first);
        if (!wasteMenuItem) setWasteMenuItem(first);
      }
      if (supplierData.length && !convertSupplier) {
        setConvertSupplier(String(supplierData[0].id));
      }
      if (supplierData.length && !alertSupplier) {
        setAlertSupplier(String(supplierData[0].id));
      }
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadKitchenData() {
    setLoading(true);
    setErr(null);
    try {
      const [prodData, wasteData, summaryData, reqData] = await Promise.all([
        listProductions({ date_from: dateFrom, date_to: dateTo }),
        listWastes({ date_from: dateFrom, date_to: dateTo }),
        getWasteSummary({ date_from: dateFrom, date_to: dateTo }),
        listKitchenPurchaseRequests(),
      ]);
      setProductions(prodData);
      await loadProductionAlertCounts(prodData);
      setWastes(wasteData);
      setWasteSummary(summaryData);
      setPurchaseRequests(reqData);
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBootstrap();
  }, []);
  useEffect(() => {
    loadKitchenData();
  }, [dateFrom, dateTo]);

  // --- Computed ---
  const prodMetrics = useMemo(() => {
    const totalPlanned = productions.reduce(
      (acc, row) => acc + Number(row.planned_qty || 0),
      0,
    );
    const totalPrepared = productions.reduce(
      (acc, row) => acc + Number(row.prepared_qty || 0),
      0,
    );
    return { count: productions.length, totalPlanned, totalPrepared };
  }, [productions]);

  const wasteMetrics = useMemo(() => {
    const totalWaste = wastes.reduce(
      (acc, row) => acc + Number(row.waste_qty || 0),
      0,
    );
    return { count: wastes.length, totalWaste };
  }, [wastes]);

  // --- Handlers ---
  async function handleSaveProduction() {
    if (!prodMenuItem) return;
    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      const resp = await upsertProduction({
        date: prodDate,
        menu_item: Number(prodMenuItem),
        planned_qty: plannedQty || "0",
        prepared_qty: preparedQty || "0",
        note: prodNote,
      });
      setPlanAlerts(resp.low_stock_alerts || null);
      setProductionAlertCounts((prev) => ({
        ...prev,
        [resp.production.id]: getAlertCount(resp.low_stock_alerts),
      }));
      setSuccess("Production row saved.");
      setSelectedProductionId(null);
      await loadKitchenData();
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  function handleSelectProductionRow(row: KitchenProduction) {
    setSelectedProductionId(row.id);
    setProdDate(row.date || todayISO());
    setProdMenuItem(String(row.menu_item));
    setPlannedQty(String(row.planned_qty ?? "0"));
    setPreparedQty(String(row.prepared_qty ?? "0"));
    setProdNote(row.note || "");
    setSuccess(`Loaded production row #${row.id}.`);
    setErr(null);

    if (productionAlertCounts[row.id] == null) {
      setLoadingAlertCounts((prev) => ({ ...prev, [row.id]: true }));
      checkPlanAlerts({
        date: row.date,
        rows: [
          {
            menu_item_id: Number(row.menu_item),
            planned_qty: String(row.planned_qty || "0"),
          },
        ],
      })
        .then((resp) => {
          setProductionAlertCounts((prev) => ({
            ...prev,
            [row.id]: getAlertCount(resp.alerts),
          }));
        })
        .finally(() => {
          setLoadingAlertCounts((prev) => {
            const next = { ...prev };
            delete next[row.id];
            return next;
          });
        });
    }
  }

  function resetProductionForm() {
    setSelectedProductionId(null);
    setProdDate(todayISO());
    setPlannedQty("0");
    setPreparedQty("0");
    setProdNote("");
    setPlanAlerts(null);
    if (items.length && !prodMenuItem) setProdMenuItem(String(items[0].id));
  }

  async function handleForecastSuggest() {
    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      const resp = await forecastSuggestProductions({
        date: forecastDate,
        save_to_production: forecastSave === "yes",
      });
      setSuccess(`Forecast generated for ${resp.count} menu items.`);
      if (forecastSave === "yes") await loadKitchenData();
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckSinglePlanAlert() {
    if (!prodMenuItem) return;
    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      const resp = await checkPlanAlerts({
        date: prodDate,
        rows: [
          {
            menu_item_id: Number(prodMenuItem),
            planned_qty: plannedQty || "0",
          },
        ],
      });
      setPlanAlerts(resp.alerts);
      const alertCount = resp.alerts?.ingredient_alerts?.length || 0;
      setSuccess(
        alertCount > 0
          ? `${alertCount} low-stock alert(s) detected.`
          : "No low-stock alerts.",
      );
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreatePurchaseRequestFromPlan() {
    if (!prodMenuItem) return;
    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      const resp = await checkPlanAlerts({
        date: prodDate,
        rows: [
          {
            menu_item_id: Number(prodMenuItem),
            planned_qty: plannedQty || "0",
          },
        ],
        create_purchase_request: true,
        note: alertNote,
      });
      setPlanAlerts(resp.alerts);
      const requestId = resp.purchase_request?.id;
      if (requestId) {
        const lineCount = resp.purchase_request?.lines?.length || 0;
        setSuccess(
          `Purchase request #${requestId} created (${lineCount} line${lineCount === 1 ? "" : "s"}).`,
        );
        await loadKitchenData();
      } else {
        setSuccess(
          "No low-stock alerts found. Purchase request was not created.",
        );
      }
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreatePurchaseDraftFromPlan() {
    if (!prodMenuItem || !alertSupplier) return;
    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      const resp = await checkPlanAlerts({
        date: prodDate,
        rows: [
          {
            menu_item_id: Number(prodMenuItem),
            planned_qty: plannedQty || "0",
          },
        ],
        auto_create_purchase_draft: true,
        supplier: Number(alertSupplier),
        purchase_invoice_date: alertInvoiceDate,
        purchase_invoice_no: alertInvoiceNo,
        note: alertNote,
      });
      setPlanAlerts(resp.alerts);
      const invoiceId = resp.purchase_invoice?.id;
      if (invoiceId) {
        setSuccess(
          `Draft purchase invoice #${invoiceId} created from low-stock alerts.`,
        );
        await loadKitchenData();
        router.push(`/purchases/${invoiceId}`);
      } else {
        setSuccess("No low-stock alerts found. Draft invoice was not created.");
      }
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWaste() {
    if (!wasteMenuItem) return;
    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      await upsertWaste({
        date: wasteDate,
        menu_item: Number(wasteMenuItem),
        waste_qty: wasteQty.trim() ? wasteQty : undefined,
        reason: wasteReason,
        note: wasteNote,
      });
      setSuccess("Waste row saved.");
      await loadKitchenData();
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleLoadWasteVsSales() {
    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      const res = await getWasteVsSales({
        date_from: dateFrom,
        date_to: dateTo,
      });
      setWasteVsSales(res.results || []);
      setSuccess(`Loaded ${res.count} waste vs sales rows.`);
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitRequest(id: number) {
    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      await submitKitchenPurchaseRequest(id);
      setSuccess(`Request #${id} submitted.`);
      await loadKitchenData();
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  function openConvertDialog(requestId: number) {
    setSelectedRequestId(requestId);
    if (suppliers.length && !convertSupplier)
      setConvertSupplier(String(suppliers[0].id));
    setConvertOpen(true);
  }

  async function handleConvertRequest() {
    if (!selectedRequestId || !convertSupplier) return;
    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      const invoice = await convertKitchenPurchaseRequestToDraft(
        selectedRequestId,
        {
          supplier: Number(convertSupplier),
          invoice_date: convertDate,
          invoice_no: convertInvoiceNo,
          note: convertNote,
        },
      );
      setConvertOpen(false);
      setSuccess(
        `Converted request #${selectedRequestId} to invoice #${invoice.id}.`,
      );
      await loadKitchenData();
      router.push(`/purchases/${invoice.id}`);
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  // --- UI Components ---
  const ingredientAlerts = planAlerts?.ingredient_alerts || [];
  const selectedMenuItemName =
    items.find((item) => String(item.id) === prodMenuItem)?.name || "-";

  return (
    <div className="min-h-screen w-full bg-muted/30 p-6 md:p-8 space-y-8">
      {/* 1. Header & Controls */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Kitchen Operations
          </h1>
          <p className="text-muted-foreground">
            Manage production planning, track waste, and handle purchase
            requests.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-card p-2 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Range:
            </span>
          </div>
          <Input
            type="date"
            className="h-9 w-40 bg-background border-muted"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <span className="text-muted-foreground hidden sm:inline">-</span>
          <Input
            type="date"
            className="h-9 w-40 bg-background border-muted"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2 text-muted-foreground hover:text-foreground"
            onClick={loadKitchenData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Notifications */}
      {(err || success) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            err
              ? "border-red-200 bg-red-50 text-red-900 dark:bg-red-900/10 dark:text-red-300 dark:border-red-900/20"
              : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/10 dark:text-emerald-300 dark:border-emerald-900/20"
          }`}
        >
          {err ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <ChefHat className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">{err || success}</span>
        </div>
      )}

      {/* 3. KPI / Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Production
            </CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prodMetrics.count}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                Items
              </span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex gap-1">
                <span className="font-medium text-foreground">
                  {fmtQty(prodMetrics.totalPlanned)}
                </span>{" "}
                Planned
              </div>
              <Separator orientation="vertical" className="h-3" />
              <div className="flex gap-1">
                <span className="font-medium text-foreground">
                  {fmtQty(prodMetrics.totalPrepared)}
                </span>{" "}
                Prepared
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Waste
            </CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fmtQty(wasteMetrics.totalWaste)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                Units
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across {wasteMetrics.count} records for selected period
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Pending Requests
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchaseRequests.filter((r) => r.status === "DRAFT").length}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                Drafts
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Generated from low-stock alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Main Tabs */}
      <Tabs defaultValue="production" className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-3 w-full max-w-md bg-muted/50 p-1">
            <TabsTrigger
              value="production"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
            >
              <ChefHat className="h-4 w-4" /> Production
            </TabsTrigger>
            <TabsTrigger
              value="waste"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
            >
              <Trash2 className="h-4 w-4" /> Waste
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
            >
              <FileText className="h-4 w-4" /> Requests
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- Tab: Production --- */}
        <TabsContent
          value="production"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Input Form */}
            <Card className="lg:col-span-1 h-fit shadow-md border-muted/60">
              <CardHeader className="bg-muted/20 border-b pb-4">
                <CardTitle className="text-base font-semibold">
                  {selectedProductionId ? "Edit Production" : "New Production"}
                </CardTitle>
                <CardDescription>
                  Plan or log prepared quantities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {selectedProductionId && (
                  <div className="text-xs rounded border border-orange-200 bg-orange-50 text-orange-800 px-3 py-2">
                    Editing Row #{selectedProductionId}
                  </div>
                )}

                <div className="grid gap-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={prodDate}
                    onChange={(e) => setProdDate(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">
                    Menu Item
                  </Label>
                  <Select value={prodMenuItem} onValueChange={setProdMenuItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs uppercase text-muted-foreground">
                      Planned
                    </Label>
                    <Input
                      value={plannedQty}
                      type="number"
                      min="0"
                      step="0.01"
                      onChange={(e) => setPlannedQty(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs uppercase text-muted-foreground">
                      Prepared
                    </Label>
                    <Input
                      value={preparedQty}
                      type="number"
                      min="0"
                      step="0.01"
                      onChange={(e) => setPreparedQty(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">
                    Note
                  </Label>
                  <Textarea
                    value={prodNote}
                    onChange={(e) => setProdNote(e.target.value)}
                    placeholder="Details..."
                    className="resize-none h-20"
                  />
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Low-Stock Ingredient Check
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Item:{" "}
                        <span className="font-medium text-foreground">
                          {selectedMenuItemName}
                        </span>
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {ingredientAlerts.length} alert
                      {ingredientAlerts.length === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  {ingredientAlerts.length > 0 ? (
                    <div className="max-h-52 overflow-auto rounded-md border bg-background">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="h-8 text-xs">
                              Ingredient
                            </TableHead>
                            <TableHead className="h-8 text-xs text-right">
                              Need
                            </TableHead>
                            <TableHead className="h-8 text-xs text-right">
                              Stock
                            </TableHead>
                            <TableHead className="h-8 text-xs text-right">
                              Suggested Buy
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ingredientAlerts.map((alert) => (
                            <TableRow key={alert.item_id}>
                              <TableCell className="text-xs">
                                <div className="flex items-center gap-2">
                                  <span>{alert.item_name}</span>
                                  <Badge
                                    variant="outline"
                                    className={
                                      alert.severity === "CRITICAL"
                                        ? "border-red-300 text-red-700"
                                        : "border-yellow-300 text-yellow-700"
                                    }
                                  >
                                    {alert.severity}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-right">
                                {fmtQty(alert.required_qty)} {alert.unit || ""}
                              </TableCell>
                              <TableCell className="text-xs text-right">
                                {fmtQty(alert.current_stock)}
                              </TableCell>
                              <TableCell className="text-xs text-right font-medium">
                                {fmtQty(alert.suggested_purchase_qty)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Run <span className="font-medium">Check Alerts</span> to
                      see ingredient shortages and suggested purchase
                      quantities.
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="grid gap-1.5">
                      <Label className="text-xs uppercase text-muted-foreground">
                        Supplier
                      </Label>
                      <Select
                        value={alertSupplier}
                        onValueChange={setAlertSupplier}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem
                              key={supplier.id}
                              value={String(supplier.id)}
                            >
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs uppercase text-muted-foreground">
                        Draft Date
                      </Label>
                      <Input
                        type="date"
                        className="h-8"
                        value={alertInvoiceDate}
                        onChange={(e) => setAlertInvoiceDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="grid gap-1.5">
                      <Label className="text-xs uppercase text-muted-foreground">
                        Invoice No
                      </Label>
                      <Input
                        className="h-8"
                        value={alertInvoiceNo}
                        onChange={(e) => setAlertInvoiceNo(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs uppercase text-muted-foreground">
                        Request Note
                      </Label>
                      <Input
                        className="h-8"
                        value={alertNote}
                        onChange={(e) => setAlertNote(e.target.value)}
                        placeholder="Optional note"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCreatePurchaseRequestFromPlan}
                      disabled={
                        saving ||
                        !prodMenuItem ||
                        Number(plannedQty || 0) <= 0 ||
                        ingredientAlerts.length === 0
                      }
                    >
                      Create Purchase Request
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreatePurchaseDraftFromPlan}
                      disabled={
                        saving ||
                        !alertSupplier ||
                        !prodMenuItem ||
                        Number(plannedQty || 0) <= 0 ||
                        ingredientAlerts.length === 0
                      }
                    >
                      Create Draft Purchase
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 bg-muted/10 border-t pt-4">
                <Button
                  className="w-full"
                  onClick={handleSaveProduction}
                  disabled={saving}
                >
                  {saving && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {selectedProductionId ? "Update Entry" : "Add Entry"}
                </Button>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCheckSinglePlanAlert}
                    disabled={saving}
                  >
                    Check Alerts
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetProductionForm}
                    disabled={saving}
                  >
                    Clear
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {/* Right: Data & Forecast */}
            <div className="lg:col-span-2 space-y-6">
              {/* Forecast Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-full">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200">
                      AI Forecasting
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Generate suggested production quantities based on
                      historical trends.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    className="h-8 w-36 bg-white"
                    value={forecastDate}
                    onChange={(e) => setForecastDate(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white hover:bg-white/90 text-blue-700 shadow-sm"
                    onClick={handleForecastSuggest}
                    disabled={saving}
                  >
                    Run Forecast
                  </Button>
                </div>
              </div>

              {/* Table Card */}
              <Card className="shadow-sm">
                <CardHeader className="py-4">
                  <CardTitle className="text-base">
                    Production Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-[120px]">Date</TableHead>
                        <TableHead>Menu Item</TableHead>
                        <TableHead className="text-center">
                          Stock Alerts
                        </TableHead>
                        <TableHead className="text-right">Suggested</TableHead>
                        <TableHead className="text-right">Planned</TableHead>
                        <TableHead className="text-right">Prepared</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productions.map((row) => (
                        <TableRow
                          key={row.id}
                          onClick={() => handleSelectProductionRow(row)}
                          className={`cursor-pointer transition-colors ${selectedProductionId === row.id ? "bg-muted/80" : "hover:bg-muted/30"}`}
                        >
                          <TableCell className="font-medium">
                            {row.date}
                          </TableCell>
                          <TableCell>
                            {row.menu_item_name || row.menu_item}
                          </TableCell>
                          <TableCell className="text-center py-2">
                            {loadingAlertCounts[row.id] ? (
                              <span className="text-xs text-muted-foreground">
                                ...
                              </span>
                            ) : (
                              <>
                                {(productionAlertCounts[row.id] || 0) > 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-50 text-amber-700 border-amber-200"
                                  >
                                    {productionAlertCounts[row.id]} Issues
                                  </Badge>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-right text-muted-foreground">
                            {fmtQty(row.suggested_qty)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {fmtQty(row.planned_qty)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {fmtQty(row.prepared_qty)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!productions.length && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center h-32 text-muted-foreground"
                          >
                            No production records found for this period.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- Tab: Waste --- */}
        <TabsContent
          value="waste"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Waste Form (Left Column) */}
            <Card className="lg:col-span-4 h-fit">
              <CardHeader className="bg-muted/20 border-b pb-4">
                <CardTitle className="text-base">Log Waste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid gap-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={wasteDate}
                    onChange={(e) => setWasteDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">
                    Item
                  </Label>
                  <Select
                    value={wasteMenuItem}
                    onValueChange={setWasteMenuItem}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs uppercase text-muted-foreground">
                      Qty
                    </Label>
                    <Input
                      value={wasteQty}
                      type="number"
                      min="0"
                      step="0.01"
                      onChange={(e) => setWasteQty(e.target.value)}
                      placeholder="Auto"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs uppercase text-muted-foreground">
                      Reason
                    </Label>
                    <Select
                      value={wasteReason || "UNSOLD"}
                      onValueChange={(v: any) => setWasteReason(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNSOLD">Unsold</SelectItem>
                        <SelectItem value="BURNT">Burnt/Spilled</SelectItem>
                        <SelectItem value="RETURNED">Returned</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">
                    Note
                  </Label>
                  <Textarea
                    value={wasteNote}
                    onChange={(e) => setWasteNote(e.target.value)}
                    placeholder="Optional..."
                    className="resize-none h-20"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSaveWaste}
                  disabled={saving}
                >
                  Record Waste
                </Button>
              </CardContent>
            </Card>

            {/* Waste Data & Analytics (Right Column) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-muted/20 border-dashed">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      Total Waste
                    </span>
                    <span className="text-xl font-bold mt-1">
                      {fmtQty(wasteSummary?.total_waste)}
                    </span>
                  </CardContent>
                </Card>
                {(wasteSummary?.by_reason || []).map((r) => (
                  <Card key={r.reason} className="bg-white">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        {r.reason}
                      </span>
                      <span className="text-xl font-bold mt-1">
                        {fmtQty(r.total_waste)}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="py-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Waste Log</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wastes.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium text-xs">
                            {row.date}
                          </TableCell>
                          <TableCell>
                            {row.menu_item_name || row.menu_item}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {row.reason}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {fmtQty(row.waste_qty)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!wastes.length && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center h-20 text-muted-foreground"
                          >
                            No waste recorded.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Analytics Toggle Section */}
              <div className="border rounded-lg bg-white p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-sm">
                      Waste vs. Sales Analysis
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Identify high-waste items.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLoadWasteVsSales}
                  >
                    Load Analysis
                  </Button>
                </div>
                {wasteVsSales.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20">
                        <TableHead className="h-8 text-xs">Menu Item</TableHead>
                        <TableHead className="h-8 text-xs text-right">
                          Sold
                        </TableHead>
                        <TableHead className="h-8 text-xs text-right">
                          Waste
                        </TableHead>
                        <TableHead className="h-8 text-xs text-right">
                          Waste %
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wasteVsSales.map((row) => (
                        <TableRow
                          key={row.menu_item_id}
                          className="hover:bg-transparent"
                        >
                          <TableCell className="py-2 text-sm">
                            {row.menu_item_name}
                          </TableCell>
                          <TableCell className="py-2 text-sm text-right text-muted-foreground">
                            {fmtQty(row.sold_qty)}
                          </TableCell>
                          <TableCell className="py-2 text-sm text-right text-red-600 font-medium">
                            {fmtQty(row.waste_qty)}
                          </TableCell>
                          <TableCell className="py-2 text-sm text-right">
                            {row.waste_rate_pct.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* --- Tab: Requests --- */}
        <TabsContent
          value="requests"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2"
        >
          <Card>
            <CardHeader className="py-4 px-6 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" /> Purchase
                Requests
              </CardTitle>
              <CardDescription>
                Automated requests generated from inventory shortages.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Source Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Lines</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{req.id}
                      </TableCell>
                      <TableCell>{req.request_date}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {req.source_plan_date || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            req.status === "DRAFT"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              : req.status === "CONVERTED"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {req.lines?.length || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs"
                            asChild
                          >
                            <Link href={`/kitchen/requests/${req.id}`}>
                              Details
                            </Link>
                          </Button>
                          {req.status === "DRAFT" && (
                            <>
                              <Separator
                                orientation="vertical"
                                className="h-4"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-green-200 hover:bg-green-50 text-green-700"
                                onClick={() => handleSubmitRequest(req.id)}
                                disabled={saving}
                              >
                                Submit
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => openConvertDialog(req.id)}
                                disabled={saving}
                              >
                                Convert <ArrowRight className="ml-1 w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!purchaseRequests.length && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center h-32 text-muted-foreground"
                      >
                        No requests found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Convert Dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to Purchase Draft</DialogTitle>
            <DialogDescription>
              Create a supplier invoice draft from Request #{selectedRequestId}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">
                Supplier
              </Label>
              <Select
                value={convertSupplier}
                onValueChange={setConvertSupplier}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs uppercase text-muted-foreground">
                  Invoice Date
                </Label>
                <Input
                  type="date"
                  value={convertDate}
                  onChange={(e) => setConvertDate(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs uppercase text-muted-foreground">
                  Invoice No
                </Label>
                <Input
                  value={convertInvoiceNo}
                  onChange={(e) => setConvertInvoiceNo(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase text-muted-foreground">
                Note
              </Label>
              <Textarea
                value={convertNote}
                onChange={(e) => setConvertNote(e.target.value)}
                className="resize-none h-20"
                placeholder="Add a note to the invoice..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConvertOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConvertRequest}
              disabled={saving || !convertSupplier}
            >
              Confirm Conversion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
