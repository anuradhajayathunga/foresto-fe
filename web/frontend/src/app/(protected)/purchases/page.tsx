"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  listPurchaseInvoices,
  PurchaseInvoice,
  exportPurchasesCsv,
  confirmPurchaseInvoice,
  sendPurchaseInvoiceEmail,
  sendPurchaseInvoiceWhatsApp,
  voidPurchaseInvoice,
} from "@/lib/purchases";
import {
  Plus,
  Download,
  Search,
  FileText,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  Filter,
  CreditCard,
  Building2,
  ArrowUpRight,
  Eye,
  Pencil,
  CheckCircle2,
  CircleSlash,
  Loader2,
  MessageCircle,
  Mail,
  AlertCircle,
  Send,
  Type,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PurchasesPage() {
  const [rows, setRows] = useState<PurchaseInvoice[]>([]);
  const [search, setSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportErr, setExportErr] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [voidingInvoice, setVoidingInvoice] = useState<PurchaseInvoice | null>(
    null,
  );
  const [voidReason, setVoidReason] = useState("");
  const [voidErr, setVoidErr] = useState<string | null>(null);
  const [emailingInvoice, setEmailingInvoice] =
    useState<PurchaseInvoice | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);

  // Default to current month for export
  const [from, setFrom] = useState(() =>
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
  );
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<"invoices" | "lines">("invoices");

  async function loadInvoices() {
    const data = await listPurchaseInvoices();
    setRows(data);
  }

  useEffect(() => {
    void loadInvoices();
  }, []);

  function getErrorMessage(e: any): string {
    return e?.detail || e?.non_field_errors?.[0] || "Request failed";
  }

  async function handleConfirmInvoice(invoice: PurchaseInvoice) {
    setActionLoadingId(invoice.id);
    try {
      await confirmPurchaseInvoice(String(invoice.id));
      toast.success("Invoice confirmed and stock updated");
      await loadInvoices();
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleVoidInvoice() {
    if (!voidingInvoice) return;
    setActionLoadingId(voidingInvoice.id);
    setVoidErr(null);
    try {
      await voidPurchaseInvoice(String(voidingInvoice.id), voidReason);
      toast.success("Invoice voided");
      setVoidingInvoice(null);
      setVoidReason("");
      await loadInvoices();
    } catch (e: any) {
      const msg = getErrorMessage(e);
      setVoidErr(msg);
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleSendWhatsApp(invoice: PurchaseInvoice) {
    setActionLoadingId(invoice.id);
    try {
      const res = await sendPurchaseInvoiceWhatsApp(String(invoice.id));
      toast.success(`WhatsApp order sent to ${res.to}`);
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleSendEmail() {
    if (!emailingInvoice) return;

    setActionLoadingId(emailingInvoice.id);
    setEmailErr(null);
    try {
      const res = await sendPurchaseInvoiceEmail(String(emailingInvoice.id), {
        to_email: emailTo.trim() || undefined,
        subject: emailSubject.trim() || undefined,
        message: emailMessage.trim() || undefined,
      });
      toast.success(`Email order sent to ${res.to}`);
      setEmailingInvoice(null);
      setEmailTo("");
      setEmailSubject("");
      setEmailMessage("");
    } catch (e: any) {
      const msg = getErrorMessage(e);
      setEmailErr(msg);
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (p) =>
        String(p.id).includes(q) ||
        (p.invoice_no || "").toLowerCase().includes(q) ||
        (p.supplier_name || "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  // --- Metrics Calculation ---
  const metrics = useMemo(() => {
    const totalSpend = filtered.reduce(
      (acc, curr) => acc + (Number(curr.total) || 0),
      0,
    );
    const uniqueSuppliers = new Set(filtered.map((r) => r.supplier_name)).size;
    return {
      totalSpend,
      count: filtered.length,
      suppliers: uniqueSuppliers,
    };
  }, [filtered]);

  // --- Formatters ---
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(val);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  async function downloadCsv() {
    setExportErr(null);
    try {
      const blob = await exportPurchasesCsv({ from, to, mode });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `purchases_${from}_to_${to}_${mode}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportOpen(false);
    } catch (e: any) {
      setExportErr(e?.message || "Export failed");
    }
  }

  const isSending = actionLoadingId === emailingInvoice?.id;

  const handleClose = (open: boolean) => {
    if (!open && !isSending) {
      setEmailingInvoice(null);
      setEmailTo("");
      setEmailSubject("");
      setEmailMessage("");
      setEmailErr(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 mx-auto w-full">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Purchases
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Monitor procurement costs, manage supplier invoices, and track
            inventory stock-ins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/purchases/new">
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Spend"
          value={formatCurrency(metrics.totalSpend)}
          sub={`Across ${metrics.count} invoices`}
          icon={CreditCard}
        />
        <MetricCard
          title="Invoices Processed"
          value={metrics.count}
          sub="Recorded in current view"
          icon={FileText}
        />
        <MetricCard
          title="Active Suppliers"
          value={metrics.suppliers}
          sub="Unique vendors interacting"
          icon={Building2}
        />
      </div>

      {/* 3. Toolbar & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-1">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search supplier, reference..."
              className="pl-9 h-9 "
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Dialog
              open={exportOpen}
              onOpenChange={(v) => {
                setExportOpen(v);
                if (!v) setExportErr(null);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export Report</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Export Purchase Data</DialogTitle>
                  <DialogDescription>
                    Generate a CSV report of your purchase history.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>From</Label>
                      <Input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>To</Label>
                      <Input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Report Format</Label>
                    <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoices">
                          Invoice Summary
                        </SelectItem>
                        <SelectItem value="lines">
                          Detailed Item Lines
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {exportErr && (
                    <div className="p-2 bg-destructive/10 text-destructive text-xs rounded flex items-center gap-2">
                      <span className="font-bold">Error:</span> {exportErr}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setExportOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={downloadCsv}>Download CSV</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Data Table */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              <TableHead className="w-[100px] pl-6">ID</TableHead>
              <TableHead className="w-[140px]">Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Invoice No</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-8">Total Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow
                key={p.id}
                className="hover:bg-muted/40 transition-colors group cursor-pointer"
              >
                <TableCell className="pl-6 font-medium">
                  <Link
                    href={`/purchases/${p.id}`}
                    className="hover:underline underline-offset-4 decoration-primary/50"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      #
                    </span>
                    {p.id}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 opacity-70" />
                    {formatDate(p.invoice_date)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">
                    {p.supplier_name}
                  </div>
                </TableCell>
                <TableCell>
                  {p.invoice_no ? (
                    <span className="font-mono text-xs font-normal bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800">
                      {p.invoice_no}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">
                      --
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-bold tabular-nums">
                    {statusBadge(p.status)}
                  </div>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <div className="font-bold tabular-nums">
                    {formatCurrency(Number(p.total))}
                  </div>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/purchases/${p.id}`}
                          className="cursor-pointer flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-2 text-muted-foreground" />{" "}
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {/* <DropdownMenuItem className="cursor-pointer flex items-center">
                        <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />{" "}
                        Edit Invoice
                      </DropdownMenuItem> */}
                      {(p.status === "REQUEST" || p.status === "DRAFT") && (
                        <DropdownMenuItem
                          className="cursor-pointer flex items-center"
                          disabled={actionLoadingId === p.id}
                          onClick={() => void handleConfirmInvoice(p)}
                        >
                          {actionLoadingId === p.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin text-emerald-600" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                          )}
                          Confirm Invoice
                        </DropdownMenuItem>
                      )}
                      {p.status !== "VOID" && p.status !== "DRAFT" && (
                        <DropdownMenuItem
                          className="cursor-pointer flex items-center"
                          disabled={actionLoadingId === p.id}
                          onClick={() => {
                            setEmailingInvoice(p);
                            setEmailTo(p.supplier_email || "");
                            setEmailSubject(`Purchase Order - ${p.invoice_no}`);
                            setEmailMessage("");
                            setEmailErr(null);
                          }}
                        >
                          {actionLoadingId === p.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin text-sky-600" />
                          ) : (
                            <Mail className="h-4 w-4 mr-2 text-sky-600" />
                          )}
                          Send Email Order
                        </DropdownMenuItem>
                      )}
                      {p.status !== "VOID" && p.status !== "DRAFT" && (
                        <DropdownMenuItem
                          className="cursor-pointer flex items-center"
                          disabled={actionLoadingId === p.id}
                          onClick={() => void handleSendWhatsApp(p)}
                        >
                          {actionLoadingId === p.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin text-emerald-600" />
                          ) : (
                            <MessageCircle className="h-4 w-4 mr-2 text-emerald-600" />
                          )}
                          Send WhatsApp Order
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {p.status !== "VOID" && (
                        <DropdownMenuItem
                          className="cursor-pointer flex items-center text-destructive focus:text-destructive"
                          disabled={actionLoadingId === p.id}
                          onClick={() => {
                            setVoidingInvoice(p);
                            setVoidErr(null);
                          }}
                        >
                          <CircleSlash className="h-4 w-4 mr-2" />
                          Void Invoice
                        </DropdownMenuItem>
                      )}                    
                      {/* <DropdownMenuItem className="cursor-pointer flex items-center text-destructive focus:text-destructive">
                        Delete
                      </DropdownMenuItem> */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="rounded-full bg-muted p-4">
                      <Search className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">
                        No purchases found
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        No invoices match your current search criteria. Try
                        adjusting your filters or create a new invoice.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearch("")}
                      className="mt-2"
                    >
                      Clear Search
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(voidingInvoice)}
        onOpenChange={(open) => {
          if (!open) {
            setVoidingInvoice(null);
            setVoidReason("");
            setVoidErr(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Void Invoice {voidingInvoice ? `${voidingInvoice.invoice_no}` : ""}
            </DialogTitle>
            <DialogDescription>
              This will set status to VOID and reverse stock if already
              confirmed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="void_reason">Reason (optional)</Label>
            <Input
              id="void_reason"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Wrong entry"
            />
            {voidErr ? (
              <div className="text-sm text-destructive">{voidErr}</div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVoidingInvoice(null);
                setVoidReason("");
                setVoidErr(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleVoidInvoice()}
              disabled={
                !voidingInvoice || actionLoadingId === voidingInvoice?.id
              }
            >
              {actionLoadingId === voidingInvoice?.id ? "Voiding..." : "Void"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(emailingInvoice)}
        onOpenChange={(open) => {
          if (!open) {
            setEmailingInvoice(null);
            setEmailTo("");
            setEmailSubject("");
            setEmailMessage("");
            setEmailErr(null);
          }
        }}
      >
        <Dialog open={Boolean(emailingInvoice)} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-slate-200 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            {/* --- Header Section --- */}
            <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 dark:bg-primary/10 dark:text-primary/40">
                    <Mail className="h-5 w-5" />
                  </div>
                  <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    Email Purchase Order
                  </DialogTitle>
                </div>
                <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Send order{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    #{emailingInvoice?.invoice_no}
                  </span>{" "}
                  to your supplier. Leave the recipient empty to use their
                  default saved email.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* --- Body Section --- */}
            <div className="px-6 space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email_to"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    Recipient (To)
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email_to"
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      // placeholder="supplier@example.com"
                      className="pl-9 bg-white dark:bg-slate-950 focus-visible:ring-primary/30"
                      disabled={isSending}
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="email_subject"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    Subject Line
                  </Label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email_subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder={`Purchase Order #${emailingInvoice?.invoice_no || ""}`}
                      className="pl-9 bg-white dark:bg-slate-950 focus-visible:ring-primary/30"
                      disabled={isSending}
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="email_message"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    >
                      Message
                    </Label>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </div>
                  <Textarea
                    id="email_message"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Add a custom note to the supplier..."
                    rows={4}
                    className="resize-none bg-white dark:bg-slate-950 focus-visible:ring-primary/30 text-sm"
                    disabled={isSending}
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    If left blank, a standard automated summary will be sent.
                  </p>
                </div>
              </div>

              {/* Error State */}
              {emailErr && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
                    {emailErr}
                  </p>
                </div>
              )}
            </div>

            {/* --- Footer Section --- */}
            <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 dark:bg-slate-900/50 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSending}
                className="bg-white dark:bg-slate-950 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleSendEmail()}
                disabled={!emailingInvoice || isSending}
                className="bg-primary text-white hover:bg-primary/80 focus-visible:ring-primary min-w-[120px]"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Dialog>
    </div>
  );
}

// --- Sub-Component for Clean Metrics ---
function MetricCard({ title, value, sub, icon: Icon }: any) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function statusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge className="bg-gray-50 text-gray-700 hover:bg-gray-50">
          Draft
        </Badge>
      );
    case "REQUEST":
      return (
        <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">
          Request
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
          Confirmed
        </Badge>
      );
    case "POSTED":
      return (
        <Badge className="bg-green-50 text-green-700 hover:bg-green-50">
          Posted
        </Badge>
      );
    case "VOID":
      return (
        <Badge className="bg-red-50 text-red-700 hover:bg-red-50">Void</Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}
