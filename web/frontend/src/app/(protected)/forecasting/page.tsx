'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getIngredientPlan,
  getForecastHistory,
  getDemandForecast,
  type IngredientPlan,
  type DemandForecastResponse
} from '@/lib/forecasting';
import {
  createPurchaseDraftFromForecast,
  listSuppliers,
  type Supplier,
} from '@/lib/purchases';
import { bulkUpsertProductions } from '@/lib/kitchen';

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

// Icons & Charts
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  RefreshCw,
  Package,
  MoreHorizontal,
  ArrowRight,
  ShoppingCart,
  CalendarDays,
  Activity
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// --- UTILS ---
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Utility for safe number parsing
function n(v: string) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null;

  const predicted = payload.find((p: any) => p?.dataKey === 'predicted')?.value;
  const actual = payload.find((p: any) => p?.dataKey === 'actual')?.value;

  return (
    <div className='bg-white border border-slate-200 p-3 rounded-lg shadow-lg text-xs min-w-[140px]'>
      <p className='font-semibold text-slate-900 mb-2 pb-2 border-b border-slate-100'>
        {label}
      </p>
      <div className='flex items-center justify-between gap-4 mb-1.5'>
        <div className='flex items-center gap-2'>
          <span className='w-2 h-2 rounded-full bg-indigo-500' />
          <span className='text-slate-500 font-medium'>Predicted</span>
        </div>
        <span className='font-mono font-medium text-slate-900'>{predicted ?? '—'}</span>
      </div>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <span className='w-2 h-2 rounded-full bg-slate-300' />
          <span className='text-slate-500 font-medium'>Actual</span>
        </div>
        <span className='font-mono font-medium text-slate-900'>{actual ?? '—'}</span>
      </div>
    </div>
  );
};

export default function UnifiedForecastPage() {
  const router = useRouter();

  // --- STATE ---
  const [scope, setScope] = useState<'tomorrow' | 'next7'>('next7');
  const [planData, setPlanData] = useState<IngredientPlan | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedChartId, setSelectedChartId] = useState<string>('');

  // --- Dialog State ---
  const [draftOpen, setDraftOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(todayISO());
  const [note, setNote] = useState<string>('');
  const [creating, setCreating] = useState(false);

  // --- Demand Forecast State ---
  const [demand, setDemand] = useState<DemandForecastResponse | null>(null);
  const [horizon, setHorizon] = useState<string>("7");
  const [topN, setTopN] = useState<string>("50");
  const [demandLoading, setDemandLoading] = useState(false);
  const [demandError, setDemandError] = useState<string | null>(null);
  const [selectedDemandItemIds, setSelectedDemandItemIds] = useState<number[]>([]);
  const [plannedQtyByItemId, setPlannedQtyByItemId] = useState<Record<number, string>>({});
  const [sendingToKitchen, setSendingToKitchen] = useState(false);
  const [kitchenMsg, setKitchenMsg] = useState<string | null>(null);
  const [kitchenErr, setKitchenErr] = useState<string | null>(null);
  const productionDate = tomorrowISO();

  // --- LOAD DATA ---
  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const p = await getIngredientPlan(scope, 7, 200);
      setPlanData(p as IngredientPlan);

      const h = await getForecastHistory(14, 50);
      setHistoryData(h);

      if (h.items?.length && !selectedChartId) {
        setSelectedChartId(String(h.items[0].menu_item_id));
      }

      const s = await listSuppliers();
      setSuppliers(s);
      if (s.length && !supplierId) setSupplierId(String(s[0].id));
    } catch (e: any) {
      setErr(e?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  useEffect(() => {
    (async () => {
      setDemandLoading(true);
      setDemandError(null);
      try {
        const d = await getDemandForecast(Number(horizon), Number(topN));
        setDemand(d);
      } catch (e: any) {
        setDemandError(e?.detail || "Failed to load demand forecast.");
      } finally {
        setDemandLoading(false);
      }
    })();
  }, [horizon, topN]);

  useEffect(() => {
    if (!demand?.items?.length) {
      setSelectedDemandItemIds([]);
      setPlannedQtyByItemId({});
      return;
    }

    setPlannedQtyByItemId((prev) => {
      const next: Record<number, string> = { ...prev };
      for (const item of demand.items) {
        if (next[item.menu_item_id] === undefined) {
          next[item.menu_item_id] = String(item.tomorrow ?? 0);
        }
      }
      return next;
    });
  }, [demand]);

  // --- MEMOS ---
  const chartDisplayData = useMemo(() => {
    if (!historyData?.items || !selectedChartId) return [];
    const item = historyData.items.find((x: any) => String(x.menu_item_id) === selectedChartId);
    if (!item?.daily) return [];

    return item.daily.map((d: any) => ({
      date: d.date.slice(5),
      actual: d.actual,
      predicted: d.yhat,
    }));
  }, [historyData, selectedChartId]);

  const ingredientStats = useMemo(() => {
    const ings = planData?.ingredients || [];
    const out = ings.filter((x) => x.status === 'OUT').length;
    const low = ings.filter((x) => x.status === 'LOW').length;
    const ok = ings.filter((x) => x.status === 'OK').length;
    const total = ings.length;
    const health = total > 0 ? Math.round((ok / total) * 100) : 100;
    return { out, low, ok, total, health };
  }, [planData]);

  const riskItems = useMemo(() => {
    if (!planData?.ingredients) return [];
    return planData.ingredients.filter((x) => x.status === 'OUT' || x.status === 'LOW');
  }, [planData]);

  // --- ACTIONS ---
  async function createDraft() {
    if (!supplierId) {
      setErr('Please select a supplier.');
      return;
    }
    setCreating(true);
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
      setErr(e?.detail || 'Failed to create draft');
    } finally {
      setCreating(false);
    }
  }

  function scrollToFullView() {
    const element = document.getElementById('full-view');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function toggleDemandSelection(menuItemId: number, checked: boolean) {
    setSelectedDemandItemIds((prev) => {
      if (checked) {
        if (prev.includes(menuItemId)) return prev;
        return [...prev, menuItemId];
      }
      return prev.filter((id) => id !== menuItemId);
    });
  }

  function toggleSelectAllDemand(checked: boolean) {
    if (!demand?.items?.length) {
      setSelectedDemandItemIds([]);
      return;
    }
    if (checked) {
      setSelectedDemandItemIds(demand.items.map((item) => item.menu_item_id));
    } else {
      setSelectedDemandItemIds([]);
    }
  }

  async function sendSelectedToKitchenProduction() {
    if (!selectedDemandItemIds.length || !demand?.items?.length) return;

    setSendingToKitchen(true);
    setKitchenErr(null);
    setKitchenMsg(null);

    try {
      const rows = selectedDemandItemIds
        .map((id) => {
          const item = demand?.items.find((x) => x.menu_item_id === id);
          if (!item) return null;

          const plannedQty = Number(plannedQtyByItemId[id] ?? item.tomorrow ?? 0);

          return {
            menu_item: id,
            planned_qty: String(Number.isFinite(plannedQty) ? Math.max(0, plannedQty) : 0),
            suggested_qty: String(item.tomorrow ?? 0),
            suggestion_basis: `FORECAST_DEMAND_${scope.toUpperCase()}`,
            note: `From forecasting demand table (${scope})`,
          };
        })
        .filter(Boolean) as Array<any>;

      if (!rows.length) {
        setKitchenErr('No valid selected menu items to send.');
        return;
      }

      const result = await bulkUpsertProductions({ date: productionDate, rows });
      setKitchenMsg(`Successfully queued ${result.count} items for production on ${productionDate}.`);
    } catch (e: any) {
      setKitchenErr(e?.detail || 'Failed to send items to Kitchen production.');
    } finally {
      setSendingToKitchen(false);
    }
  }

  return (
    <div className='flex flex-col gap-8 p-6 md:p-10 max-w-[1400px] mx-auto w-full bg-slate-50/50 min-h-screen'>
      
      {/* 1. HEADER & CONTROLS */}
      <div className='flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-2'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-semibold tracking-tight text-slate-900'>
            Demand Intelligence
          </h1>
          <p className='text-sm text-slate-500 max-w-lg'>
            Monitor AI-driven sales forecasts and actionable stock suggestions to optimize your kitchen prep for <span className="font-medium text-slate-700">{scope === 'next7' ? 'the next 7 days' : 'tomorrow'}</span>.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          {/* Segmented Control */}
          <div className='flex bg-slate-200/60 p-1 rounded-lg border border-slate-200'>
            <button
              onClick={() => setScope('tomorrow')}
              className={`text-xs px-4 py-1.5 rounded-md transition-all font-medium ${
                scope === 'tomorrow'
                  ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-900/5'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setScope('next7')}
              className={`text-xs px-4 py-1.5 rounded-md transition-all font-medium ${
                scope === 'next7'
                  ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-900/5'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              Next 7 Days
            </button>
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={loadAll}
            disabled={loading}
            className='h-8 bg-white shadow-sm'
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
            <DialogTrigger asChild>
              <Button size='sm' className='h-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors'>
                <ShoppingCart className='mr-2 h-3.5 w-3.5' />
                Auto-Generate PO
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Purchase Draft</DialogTitle>
                <CardDescription>Compile low-stock items into a supplier purchase order draft.</CardDescription>
              </DialogHeader>
              <div className='space-y-5 py-4'>
                <div className='space-y-1.5'>
                  <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder='Select supplier' />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-1.5'>
                  <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Expected Date</Label>
                  <Input
                    type='date'
                    className='h-9'
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Internal Note</Label>
                  <Textarea
                    className="resize-none min-h-[80px]"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder='Add contextual notes for the purchasing manager...'
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant='outline' onClick={() => setDraftOpen(false)}>Cancel</Button>
                <Button onClick={createDraft} disabled={creating || !suppliers.length} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {creating ? 'Generating...' : 'Create Draft'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {err && (
        <div className='bg-red-50 text-red-800 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-3 shadow-sm'>
          <AlertTriangle className='h-4 w-4 shrink-0 text-red-500' /> {err}
        </div>
      )}

      {/* 2. KPI GRID */}
      <div className='grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='shadow-sm border-slate-200/60'>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-medium text-slate-500">Yesterday's Sales</h3>
               <div className='p-1.5 bg-indigo-50 rounded-md ring-1 ring-indigo-100'>
                  <Activity className='h-4 w-4 text-indigo-600' />
               </div>
            </div>
            <div className='text-3xl font-bold text-slate-900 tabular-nums tracking-tight'>
              {historyData?.items ? historyData.items.reduce((acc: number, item: any) => acc + (item.yesterday_actual || 0), 0) : 0}
            </div>
            <p className='text-xs text-slate-500 mt-2 font-medium'>
              vs. Predicted: {historyData?.items ? historyData.items.reduce((acc: number, item: any) => acc + (item.yesterday_pred || 0), 0) : 0}
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-sm border-slate-200/60'>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-medium text-slate-500">Stock Health</h3>
               <div className={`p-1.5 rounded-md ring-1 ${ingredientStats.health < 100 ? 'bg-amber-50 ring-amber-100' : 'bg-emerald-50 ring-emerald-100'}`}>
                  <ChefHat className={`h-4 w-4 ${ingredientStats.health < 100 ? 'text-amber-600' : 'text-emerald-600'}`} />
               </div>
            </div>
            <div className='flex items-end gap-2 mb-2'>
              <div className='text-3xl font-bold text-slate-900 tabular-nums tracking-tight'>
                {ingredientStats.health}%
              </div>
            </div>
            <Progress
              value={ingredientStats.health}
              className='h-1.5 bg-slate-100'
              indicatorClassName={ingredientStats.health < 50 ? 'bg-red-500' : ingredientStats.health < 90 ? 'bg-amber-500' : 'bg-emerald-500'}
            />
            <p className='text-xs text-slate-500 mt-2 font-medium'>
              {ingredientStats.out + ingredientStats.low} Items require attention
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-sm border-slate-200/60 ring-1 ring-transparent hover:ring-red-500/10 transition-all'>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-medium text-slate-500">Out of Stock</h3>
               <div className='p-1.5 bg-red-50 rounded-md ring-1 ring-red-100'>
                  <AlertTriangle className='h-4 w-4 text-red-600' />
               </div>
            </div>
            <div className='text-3xl font-bold text-red-600 tabular-nums tracking-tight'>
              {ingredientStats.out}
            </div>
            <p className='text-xs text-slate-500 mt-2 font-medium'>
              Critical blockers
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-sm border-slate-200/60 ring-1 ring-transparent hover:ring-amber-500/10 transition-all'>
          <CardContent className="p-5">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-medium text-slate-500">Low Stock</h3>
               <div className='p-1.5 bg-amber-50 rounded-md ring-1 ring-amber-100'>
                  <Package className='h-4 w-4 text-amber-600' />
               </div>
            </div>
            <div className='text-3xl font-bold text-amber-600 tabular-nums tracking-tight'>
              {ingredientStats.low}
            </div>
            <p className='text-xs text-slate-500 mt-2 font-medium'>
              Reorder suggested
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 grid-cols-1 lg:grid-cols-3'>
        {/* 3. CHART: Forecast Accuracy */}
        <Card className='lg:col-span-2 shadow-sm border-slate-200/60 flex flex-col'>
          <CardHeader className="pb-2 border-b border-slate-100/50">
            <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
              <div>
                <CardTitle className='text-base font-semibold text-slate-900'>
                  Model Accuracy Over Time
                </CardTitle>
                <CardDescription className='text-xs text-slate-500 mt-1'>
                  Tracking actual sales vs. AI predictions (Past 14 Days)
                </CardDescription>
              </div>
              <div className='w-full sm:w-[220px]'>
                <Select value={selectedChartId} onValueChange={setSelectedChartId}>
                  <SelectTrigger className='h-8 text-xs bg-slate-50 border-slate-200'>
                    <SelectValue placeholder='Select Item' />
                  </SelectTrigger>
                  <SelectContent>
                    {historyData?.items?.map((x: any) => (
                      <SelectItem key={x.menu_item_id} value={String(x.menu_item_id)}>
                        {x.menu_item_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className='pt-6 pl-0 pr-6 pb-2 flex-1 min-h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={chartDisplayData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id='colorPredicted' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#6366f1' stopOpacity={0.2} />
                    <stop offset='95%' stopColor='#6366f1' stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='4 4' vertical={false} stroke='#e2e8f0' />
                <XAxis dataKey='date' tickLine={false} axisLine={false} tickMargin={12} fontSize={11} tick={{ fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tickMargin={12} fontSize={11} tick={{ fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                
                {/* Real Data Series */}
                <Area type='monotone' dataKey='actual' name='Actual Sales' stroke='#94a3b8' strokeWidth={2} strokeDasharray='4 4' fill='transparent' activeDot={{ r: 4, fill: '#94a3b8' }} />
                <Area type='monotone' dataKey='predicted' name='Predicted' stroke='#6366f1' strokeWidth={2} fillOpacity={1} fill='url(#colorPredicted)' activeDot={{ r: 5, strokeWidth: 0, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. RISK FEED */}
        <Card className='lg:col-span-1 shadow-sm border-slate-200/60 flex flex-col max-h-[400px]'>
          <CardHeader className='pb-3 border-b border-slate-100 bg-slate-50/50'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-semibold text-slate-800 flex items-center gap-2'>
                Inventory Risks
              </CardTitle>
              <Badge variant='secondary' className='text-[10px] font-medium bg-slate-200/50 text-slate-600'>
                {riskItems.length} alerts
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='p-0 overflow-y-auto flex-1 custom-scrollbar'>
            {riskItems.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full p-8 text-center'>
                <CheckCircle2 className='h-8 w-8 mb-3 text-emerald-400' />
                <p className='text-sm font-medium text-slate-700'>Looking good!</p>
                <p className='text-xs text-slate-500 mt-1'>No immediate stock risks detected.</p>
              </div>
            ) : (
              <div className='divide-y divide-slate-100'>
                {riskItems.slice(0, 5).map((item) => (
                  <div key={item.ingredient_id} className='p-4 hover:bg-slate-50 transition-colors'>
                    <div className='flex items-start justify-between mb-2'>
                      <div>
                        <p className='text-sm font-medium text-slate-900'>{item.ingredient_name}</p>
                        <p className='text-[11px] text-slate-500 font-mono mt-0.5'>{item.sku}</p>
                      </div>
                      <Badge variant='outline' className={`text-[10px] font-medium border-0 ${item.status === 'OUT' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        {item.status}
                      </Badge>
                    </div>
                    <div className='flex items-center justify-between mt-3 text-xs'>
                      <div className='flex items-center gap-3 text-slate-500'>
                        <span>Need: <strong className='text-slate-700'>{item.required_qty}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Have: <strong className='text-slate-700'>{item.current_stock}</strong></span>
                      </div>
                      <div className='bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium flex items-center gap-1.5'>
                        <ShoppingCart className="w-3 h-3 text-slate-400" />
                        +{item.suggested_purchase_qty}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {riskItems.length > 5 && (
            <CardFooter className='p-2 border-t border-slate-100 bg-slate-50/50'>
              <Button variant='ghost' size='sm' className='w-full text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50' onClick={scrollToFullView}>
                View all {riskItems.length} alerts
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* 5. MENU ITEM DEMAND & KITCHEN SCHEDULING */}
      <Card className="shadow-sm border-slate-200/60 overflow-hidden">
        {/* Card Header acts as a structural container */}
        <div className="border-b border-slate-200 bg-white p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Production Scheduling</CardTitle>
              <CardDescription className="text-sm mt-1">
                Forecasted item demand starting <span className="font-medium text-slate-700">{demand?.start_date || "today"}</span>. Edit quantities and queue for kitchen prep.
              </CardDescription>
            </div>
            
            {/* Toolbar Area */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 px-2 border-r border-slate-200">
                 <CalendarDays className="w-4 h-4 text-slate-400" />
                 <span className="text-xs font-medium text-slate-600">Filters</span>
              </div>
              <Select value={horizon} onValueChange={setHorizon}>
                <SelectTrigger className="h-8 w-[110px] bg-white text-xs border-slate-200 shadow-sm">
                  <SelectValue placeholder="Horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day out</SelectItem>
                  <SelectItem value="7">7 days out</SelectItem>
                  <SelectItem value="14">14 days out</SelectItem>
                  <SelectItem value="30">30 days out</SelectItem>
                </SelectContent>
              </Select>

              <Select value={topN} onValueChange={setTopN}>
                <SelectTrigger className="h-8 w-[100px] bg-white text-xs border-slate-200 shadow-sm">
                  <SelectValue placeholder="Items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="25">Top 25</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                  <SelectItem value="100">Top 100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Bar Sub-row */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium">
                {selectedDemandItemIds.length} Selected
              </Badge>
              {kitchenMsg && <span className="text-xs font-medium text-emerald-600 animate-in fade-in">{kitchenMsg}</span>}
              {kitchenErr && <span className="text-xs font-medium text-red-600 animate-in fade-in">{kitchenErr}</span>}
            </div>
            <Button
              size='sm'
              className="h-8 bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
              onClick={sendSelectedToKitchenProduction}
              disabled={!selectedDemandItemIds.length || sendingToKitchen || demandLoading}
            >
              {sendingToKitchen ? (
                <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
              ) : (
                <ChefHat className="w-3.5 h-3.5 mr-2" />
              )}
              {sendingToKitchen ? 'Queueing...' : 'Queue to Kitchen'}
            </Button>
          </div>
        </div>

        {/* The Data Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                <TableHead className='w-[60px] text-center'>
                  <Checkbox 
                    checked={!!demand?.items?.length && selectedDemandItemIds.length === demand.items.length}
                    onCheckedChange={(checked) => toggleSelectAllDemand(!!checked)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Menu Item</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-slate-500 tracking-wider text-right">Tomorrow</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-slate-500 tracking-wider text-right">Trend ({demand?.horizon_days || horizon}d)</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-slate-500 tracking-wider text-right">Avg/Day</TableHead>
                <TableHead className='text-xs font-semibold uppercase text-slate-500 tracking-wider text-right w-[180px] pr-6'>Target Prep Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {demandLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <RefreshCw className="w-5 h-5 animate-spin text-slate-300 mx-auto" />
                  </TableCell>
                </TableRow>
              )}

              {!demandLoading && demandError && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-red-500 font-medium">
                    {demandError}
                  </TableCell>
                </TableRow>
              )}

              {!demandLoading && !demandError && demand?.items?.map((item) => (
                <TableRow key={item.menu_item_id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className='text-center'>
                    <Checkbox 
                      checked={selectedDemandItemIds.includes(item.menu_item_id)}
                      onCheckedChange={(checked) => toggleDemandSelection(item.menu_item_id, !!checked)}
                      aria-label={`Select ${item.menu_item_name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 text-sm">{item.menu_item_name}</TableCell>
                  <TableCell className="text-right text-slate-600 font-mono text-sm">{item.tomorrow}</TableCell>
                  <TableCell className="text-right text-slate-600 font-mono text-sm">{item.next_7_days_total}</TableCell>
                  <TableCell className="text-right text-slate-500 font-mono text-sm">
                    {demand.horizon_days > 0 ? (item.next_7_days_total / demand.horizon_days).toFixed(1) : "0.0"}
                  </TableCell>
                  <TableCell className='text-right pr-6'>
                    <Input
                      type='number'
                      min='0'
                      step='1'
                      className={`h-8 w-24 ml-auto text-right font-mono transition-all ${
                        selectedDemandItemIds.includes(item.menu_item_id) 
                        ? 'border-indigo-300 bg-indigo-50/30 focus-visible:ring-indigo-500 text-indigo-900' 
                        : 'border-slate-200 text-slate-600 bg-transparent'
                      }`}
                      value={plannedQtyByItemId[item.menu_item_id] ?? String(item.tomorrow ?? 0)}
                      onChange={(e) =>
                        setPlannedQtyByItemId((prev) => ({
                          ...prev,
                          [item.menu_item_id]: e.target.value,
                        }))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}

              {!demandLoading && !demandError && !demand?.items?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-slate-500">
                    No demand forecast data available for this horizon.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* 6. RAW INGREDIENT BREAKDOWN */}
      <Card id='full-view' className='shadow-sm border-slate-200/60 overflow-hidden'>
        <div className="border-b border-slate-200 bg-slate-50/50 p-5 lg:p-6">
          <CardTitle className='text-lg font-semibold text-slate-900'>
            Raw Ingredient Logistics
          </CardTitle>
          <CardDescription className='mt-1 text-sm'>
            Complete bottom-up breakdown of raw ingredients required to fulfill the {scope} forecast.
          </CardDescription>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className='bg-white border-b border-slate-200'>
                <TableHead className='pl-6 h-11 text-xs font-semibold uppercase text-slate-500 tracking-wider'>Ingredient</TableHead>
                <TableHead className='h-11 text-xs font-semibold uppercase text-slate-500 tracking-wider'>Status</TableHead>
                <TableHead className='text-right h-11 text-xs font-semibold uppercase text-slate-500 tracking-wider'>In Stock</TableHead>
                <TableHead className='text-right h-11 text-xs font-semibold uppercase text-slate-500 tracking-wider'>Required</TableHead>
                <TableHead className='text-right h-11 text-xs font-semibold uppercase text-slate-500 tracking-wider'>Deficit</TableHead>
                <TableHead className='text-right h-11 pr-6 text-xs font-bold uppercase text-indigo-600 tracking-wider'>
                  Suggested Buy
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {planData?.ingredients?.map((x) => (
                <TableRow key={x.ingredient_id} className='group hover:bg-slate-50/50 transition-colors'>
                  <TableCell className='pl-6 py-3'>
                    <span className="font-medium text-sm text-slate-900 block">{x.ingredient_name}</span>
                    <span className='text-xs text-slate-400 font-mono mt-0.5 block'>
                      {x.sku} ({x.unit})
                    </span>
                  </TableCell>
                  <TableCell>
                    {x.status === 'OUT' ? (
                      <Badge variant='outline' className='font-medium text-[10px] uppercase border-red-200 text-red-700 bg-red-50'>Empty</Badge>
                    ) : x.status === 'LOW' ? (
                      <Badge variant='outline' className='font-medium text-[10px] uppercase border-amber-200 text-amber-700 bg-amber-50'>Low</Badge>
                    ) : (
                      <Badge variant='outline' className='font-medium text-[10px] uppercase border-slate-200 text-slate-600 bg-slate-50'>Healthy</Badge>
                    )}
                  </TableCell>
                  <TableCell className='text-right font-mono text-sm text-slate-600'>
                    {x.current_stock}
                  </TableCell>
                  <TableCell className='text-right font-mono text-sm text-slate-900'>
                    {x.required_qty}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-sm ${Number(x.projected_remaining) < 0 ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                    {x.projected_remaining}
                  </TableCell>
                  <TableCell className='text-right pr-6 font-mono text-sm font-semibold text-indigo-600'>
                    {Number(x.suggested_purchase_qty) > 0 ? `+${x.suggested_purchase_qty}` : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {!planData?.ingredients?.length && (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center text-sm text-slate-500'>
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-300" /> : 'No ingredient dependencies found for this plan.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}