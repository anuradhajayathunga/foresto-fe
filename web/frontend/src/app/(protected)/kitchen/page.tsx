'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchItems, type MenuItem } from '@/lib/menu';
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
  type KitchenProduction,
  type KitchenWaste,
  type KitchenPurchaseRequest,
} from '@/lib/kitchen';
import { listSuppliers, type Supplier } from '@/lib/purchases';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChefHat, AlertTriangle, RefreshCw } from 'lucide-react';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function parseError(error: any): string {
  if (!error) return 'Request failed.';
  if (typeof error === 'string') return error;
  if (error.detail) return String(error.detail);
  const firstKey = Object.keys(error)[0];
  const value = firstKey ? error[firstKey] : null;
  if (Array.isArray(value) && value.length) return String(value[0]);
  if (typeof value === 'string') return value;
  return 'Request failed.';
}

function fmtQty(v: string | number | null | undefined) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

export default function KitchenPage() {
  const router = useRouter();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [productions, setProductions] = useState<KitchenProduction[]>([]);
  const [wastes, setWastes] = useState<KitchenWaste[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<KitchenPurchaseRequest[]>([]);

  const [dateFrom, setDateFrom] = useState<string>(() => todayISO());
  const [dateTo, setDateTo] = useState<string>(() => todayISO());

  const [prodDate, setProdDate] = useState<string>(() => todayISO());
  const [prodMenuItem, setProdMenuItem] = useState<string>('');
  const [plannedQty, setPlannedQty] = useState<string>('0');
  const [preparedQty, setPreparedQty] = useState<string>('0');
  const [prodNote, setProdNote] = useState<string>('');

  const [forecastDate, setForecastDate] = useState<string>(() => tomorrowISO());
  const [forecastSave, setForecastSave] = useState<'yes' | 'no'>('yes');

  const [wasteDate, setWasteDate] = useState<string>(() => todayISO());
  const [wasteMenuItem, setWasteMenuItem] = useState<string>('');
  const [wasteQty, setWasteQty] = useState<string>('');
  const [wasteReason, setWasteReason] = useState<'UNSOLD' | 'BURNT' | 'RETURNED' | 'EXPIRED' | ''>('UNSOLD');
  const [wasteNote, setWasteNote] = useState<string>('');

  const [wasteSummary, setWasteSummary] = useState<{ total_waste: string; by_reason: Array<{ reason: string; total_waste: string }> } | null>(null);
  const [wasteVsSales, setWasteVsSales] = useState<Array<{ menu_item_id: number; menu_item_name: string; sold_qty: string; waste_qty: string; waste_rate_pct: number }>>([]);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [convertSupplier, setConvertSupplier] = useState<string>('');
  const [convertDate, setConvertDate] = useState<string>(() => todayISO());
  const [convertInvoiceNo, setConvertInvoiceNo] = useState<string>('');
  const [convertNote, setConvertNote] = useState<string>('');

  async function loadBootstrap() {
    setLoading(true);
    setErr(null);
    try {
      const [menuData, supplierData] = await Promise.all([
        fetchItems({ is_available: 'true' }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadKitchenData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const prodMetrics = useMemo(() => {
    const totalPlanned = productions.reduce((acc, row) => acc + Number(row.planned_qty || 0), 0);
    const totalPrepared = productions.reduce((acc, row) => acc + Number(row.prepared_qty || 0), 0);
    return {
      count: productions.length,
      totalPlanned,
      totalPrepared,
    };
  }, [productions]);

  const wasteMetrics = useMemo(() => {
    const totalWaste = wastes.reduce((acc, row) => acc + Number(row.waste_qty || 0), 0);
    return {
      count: wastes.length,
      totalWaste,
    };
  }, [wastes]);

  async function handleSaveProduction() {
    if (!prodMenuItem) return;
    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      await upsertProduction({
        date: prodDate,
        menu_item: Number(prodMenuItem),
        planned_qty: plannedQty || '0',
        prepared_qty: preparedQty || '0',
        note: prodNote,
      });
      setSuccess('Production row saved.');
      await loadKitchenData();
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleForecastSuggest() {
    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      const resp = await forecastSuggestProductions({
        date: forecastDate,
        save_to_production: forecastSave === 'yes',
      });
      setSuccess(`Forecast generated for ${resp.count} menu items.`);
      if (forecastSave === 'yes') {
        await loadKitchenData();
      }
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
            planned_qty: plannedQty || '0',
          },
        ],
      });
      const alertCount = resp.alerts?.ingredient_alerts?.length || 0;
      setSuccess(alertCount > 0 ? `${alertCount} low-stock alert(s) detected.` : 'No low-stock alerts for this plan.');
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
      setSuccess('Waste row saved.');
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
      const res = await getWasteVsSales({ date_from: dateFrom, date_to: dateTo });
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
      setSuccess(`Purchase request #${id} submitted.`);
      await loadKitchenData();
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  function openConvertDialog(requestId: number) {
    setSelectedRequestId(requestId);
    if (suppliers.length && !convertSupplier) {
      setConvertSupplier(String(suppliers[0].id));
    }
    setConvertOpen(true);
  }

  async function handleConvertRequest() {
    if (!selectedRequestId || !convertSupplier) return;

    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      const invoice = await convertKitchenPurchaseRequestToDraft(selectedRequestId, {
        supplier: Number(convertSupplier),
        invoice_date: convertDate,
        invoice_no: convertInvoiceNo,
        note: convertNote,
      });
      setConvertOpen(false);
      setSuccess(`Converted request #${selectedRequestId} to purchase invoice #${invoice.id}.`);
      await loadKitchenData();
      router.push(`/purchases/${invoice.id}`);
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='flex flex-col gap-6 mx-auto w-full'>
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border/40 pb-6'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>Kitchen</h1>
          <p className='text-sm text-muted-foreground max-w-2xl'>
            Plan production, track waste, and convert kitchen shortages into purchase requests.
          </p>
        </div>
        <Button variant='outline' size='sm' className='h-9 gap-2' onClick={loadKitchenData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Production Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{prodMetrics.count}</p>
            <p className='text-xs text-muted-foreground'>Planned {fmtQty(prodMetrics.totalPlanned)} | Prepared {fmtQty(prodMetrics.totalPrepared)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Waste Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{wasteMetrics.count}</p>
            <p className='text-xs text-muted-foreground'>Total waste {fmtQty(wasteMetrics.totalWaste)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Purchase Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{purchaseRequests.length}</p>
            <p className='text-xs text-muted-foreground'>Generated from kitchen low-stock alerts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Filter</CardTitle>
          <CardDescription>Applies to production and waste lists.</CardDescription>
        </CardHeader>
        <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='dateFrom'>From</Label>
            <Input id='dateFrom' type='date' value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='dateTo'>To</Label>
            <Input id='dateTo' type='date' value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {(err || success) && (
        <div className='space-y-2'>
          {err && (
            <div className='flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
              <AlertTriangle className='h-4 w-4' /> {err}
            </div>
          )}
          {success && (
            <div className='flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'>
              <ChefHat className='h-4 w-4' /> {success}
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue='production' className='w-full'>
        <TabsList className='grid grid-cols-3 w-full max-w-xl'>
          <TabsTrigger value='production'>Production</TabsTrigger>
          <TabsTrigger value='waste'>Waste</TabsTrigger>
          <TabsTrigger value='requests'>Purchase Requests</TabsTrigger>
        </TabsList>

        <TabsContent value='production' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Upsert Production Row</CardTitle>
              <CardDescription>Create or update one menu item production record.</CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='grid gap-2'>
                <Label>Date</Label>
                <Input type='date' value={prodDate} onChange={(e) => setProdDate(e.target.value)} />
              </div>
              <div className='grid gap-2'>
                <Label>Menu Item</Label>
                <Select value={prodMenuItem} onValueChange={setProdMenuItem}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select menu item' />
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
              <div className='grid gap-2'>
                <Label>Planned Qty</Label>
                <Input value={plannedQty} type='number' min='0' step='0.01' onChange={(e) => setPlannedQty(e.target.value)} />
              </div>
              <div className='grid gap-2'>
                <Label>Prepared Qty</Label>
                <Input value={preparedQty} type='number' min='0' step='0.01' onChange={(e) => setPreparedQty(e.target.value)} />
              </div>
              <div className='grid gap-2 md:col-span-2'>
                <Label>Note</Label>
                <Textarea value={prodNote} onChange={(e) => setProdNote(e.target.value)} placeholder='Optional note' />
              </div>
              <div className='flex items-end gap-2'>
                <Button onClick={handleSaveProduction} disabled={saving}>Save Production</Button>
                <Button variant='outline' onClick={handleCheckSinglePlanAlert} disabled={saving}>Check Alerts</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forecast Suggestion</CardTitle>
              <CardDescription>Use forecasting model to suggest quantities for a future date.</CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div className='grid gap-2'>
                <Label>Forecast Date</Label>
                <Input type='date' value={forecastDate} onChange={(e) => setForecastDate(e.target.value)} />
              </div>
              <div className='grid gap-2'>
                <Label>Save to Production</Label>
                <Select value={forecastSave} onValueChange={(v: 'yes' | 'no') => setForecastSave(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='yes'>Yes</SelectItem>
                    <SelectItem value='no'>No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex items-end'>
                <Button variant='outline' onClick={handleForecastSuggest} disabled={saving}>Run Forecast</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Production Rows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Menu Item</TableHead>
                      <TableHead className='text-right'>Suggested</TableHead>
                      <TableHead className='text-right'>Planned</TableHead>
                      <TableHead className='text-right'>Prepared</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productions.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.menu_item_name || row.menu_item}</TableCell>
                        <TableCell className='text-right'>{fmtQty(row.suggested_qty)}</TableCell>
                        <TableCell className='text-right'>{fmtQty(row.planned_qty)}</TableCell>
                        <TableCell className='text-right'>{fmtQty(row.prepared_qty)}</TableCell>
                      </TableRow>
                    ))}
                    {!productions.length && (
                      <TableRow>
                        <TableCell colSpan={5} className='text-center h-20 text-muted-foreground'>No production rows in selected range.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='waste' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Upsert Waste Row</CardTitle>
              <CardDescription>Leave quantity empty to auto-calculate unsold waste for the date.</CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='grid gap-2'>
                <Label>Date</Label>
                <Input type='date' value={wasteDate} onChange={(e) => setWasteDate(e.target.value)} />
              </div>
              <div className='grid gap-2'>
                <Label>Menu Item</Label>
                <Select value={wasteMenuItem} onValueChange={setWasteMenuItem}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select menu item' />
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
              <div className='grid gap-2'>
                <Label>Waste Qty</Label>
                <Input value={wasteQty} type='number' min='0' step='0.01' onChange={(e) => setWasteQty(e.target.value)} placeholder='Auto if empty' />
              </div>
              <div className='grid gap-2'>
                <Label>Reason</Label>
                <Select value={wasteReason || 'UNSOLD'} onValueChange={(v: any) => setWasteReason(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='UNSOLD'>UNSOLD</SelectItem>
                    <SelectItem value='BURNT'>BURNT</SelectItem>
                    <SelectItem value='RETURNED'>RETURNED</SelectItem>
                    <SelectItem value='EXPIRED'>EXPIRED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2 md:col-span-2'>
                <Label>Note</Label>
                <Textarea value={wasteNote} onChange={(e) => setWasteNote(e.target.value)} placeholder='Optional note' />
              </div>
              <div className='flex items-end'>
                <Button onClick={handleSaveWaste} disabled={saving}>Save Waste</Button>
              </div>
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle>Waste Summary</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <p className='text-sm'>Total waste: <span className='font-semibold'>{fmtQty(wasteSummary?.total_waste)}</span></p>
                <div className='space-y-1'>
                  {(wasteSummary?.by_reason || []).map((r) => (
                    <div key={r.reason || 'EMPTY'} className='flex items-center justify-between text-sm'>
                      <span>{r.reason || 'Unspecified'}</span>
                      <span className='font-medium'>{fmtQty(r.total_waste)}</span>
                    </div>
                  ))}
                  {!(wasteSummary?.by_reason || []).length && (
                    <p className='text-sm text-muted-foreground'>No summary rows.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Waste vs Sales</CardTitle>
                <CardDescription>Compare sold quantities and waste rates for selected dates.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant='outline' onClick={handleLoadWasteVsSales} disabled={saving}>Load Waste vs Sales</Button>
                <div className='rounded-md border mt-4 overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Menu Item</TableHead>
                        <TableHead className='text-right'>Sold</TableHead>
                        <TableHead className='text-right'>Waste</TableHead>
                        <TableHead className='text-right'>Waste %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wasteVsSales.map((row) => (
                        <TableRow key={row.menu_item_id}>
                          <TableCell>{row.menu_item_name}</TableCell>
                          <TableCell className='text-right'>{fmtQty(row.sold_qty)}</TableCell>
                          <TableCell className='text-right'>{fmtQty(row.waste_qty)}</TableCell>
                          <TableCell className='text-right'>{row.waste_rate_pct.toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                      {!wasteVsSales.length && (
                        <TableRow>
                          <TableCell colSpan={4} className='text-center h-20 text-muted-foreground'>No rows loaded yet.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Waste Rows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Menu Item</TableHead>
                      <TableHead className='text-right'>Qty</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wastes.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.menu_item_name || row.menu_item}</TableCell>
                        <TableCell className='text-right'>{fmtQty(row.waste_qty)}</TableCell>
                        <TableCell>{row.reason || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {!wastes.length && (
                      <TableRow>
                        <TableCell colSpan={4} className='text-center h-20 text-muted-foreground'>No waste rows in selected range.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='requests' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Kitchen Purchase Requests</CardTitle>
              <CardDescription>Requests created from kitchen low-stock alerts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Source Plan Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='text-right'>Lines</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className='font-medium'>#{req.id}</TableCell>
                        <TableCell>{req.request_date}</TableCell>
                        <TableCell>{req.source_plan_date || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={req.status === 'DRAFT' ? 'secondary' : 'outline'}>{req.status}</Badge>
                        </TableCell>
                        <TableCell className='text-right'>{req.lines?.length || 0}</TableCell>
                        <TableCell className='text-right space-x-2'>
                          <Button size='sm' variant='ghost' asChild>
                            <Link href={`/kitchen/requests/${req.id}`}>View</Link>
                          </Button>
                          <Button size='sm' variant='outline' disabled={saving || req.status !== 'DRAFT'} onClick={() => handleSubmitRequest(req.id)}>
                            Submit
                          </Button>
                          <Button size='sm' disabled={saving || req.status === 'CANCELLED' || req.status === 'CONVERTED'} onClick={() => openConvertDialog(req.id)}>
                            Convert
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!purchaseRequests.length && (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center h-24 text-muted-foreground'>No kitchen purchase requests found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Request to Purchase Draft</DialogTitle>
            <DialogDescription>
              Convert kitchen purchase request #{selectedRequestId ?? '-'} into a draft purchase invoice.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-2'>
            <div className='grid gap-2'>
              <Label>Supplier</Label>
              <Select value={convertSupplier} onValueChange={setConvertSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder='Select supplier' />
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
            <div className='grid gap-2'>
              <Label>Invoice Date</Label>
              <Input type='date' value={convertDate} onChange={(e) => setConvertDate(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label>Invoice No</Label>
              <Input value={convertInvoiceNo} onChange={(e) => setConvertInvoiceNo(e.target.value)} placeholder='Optional invoice reference' />
            </div>
            <div className='grid gap-2'>
              <Label>Note</Label>
              <Textarea value={convertNote} onChange={(e) => setConvertNote(e.target.value)} placeholder='Optional conversion note' />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button onClick={handleConvertRequest} disabled={saving || !convertSupplier}>Convert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
