'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getIngredientPlan,
  getForecastHistory,
  type IngredientPlan,
} from '@/lib/forecasting';
import {
  createPurchaseDraftFromForecast,
  listSuppliers,
  type Supplier,
} from '@/lib/purchases';

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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Link from 'next/link';

// --- UTILS ---
function todayISO() {
  const d = new Date();
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
    <div className='bg-white dark:bg-zinc-900 border border-border p-3 rounded-lg shadow-xl text-xs'>
      <p className='font-semibold text-foreground mb-2 pb-1 border-b border-border'>
        {label}
      </p>

      <div className='flex items-center gap-2 mb-1'>
        <span className='w-2 h-2 rounded-full bg-orange-500' />
        <span className='text-muted-foreground'>Predicted:</span>
        <span className='font-mono font-bold text-foreground'>
          {predicted ?? '—'}
        </span>
      </div>

      <div className='flex items-center gap-2'>
        <span className='w-2 h-2 rounded-full bg-slate-400' />
        <span className='text-muted-foreground'>Actual:</span>
        <span className='font-mono font-bold text-foreground'>
          {actual ?? '—'}
        </span>
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

  // --- MEMOS ---
  const chartDisplayData = useMemo(() => {
    if (!historyData?.items || !selectedChartId) return [];
    // 1. Find selected item
    const item = historyData.items.find(
      (x: any) => String(x.menu_item_id) === selectedChartId
    );
    if (!item?.daily) return [];

    // 2. Map ACTUAL history data
    return item.daily.map((d: any) => ({
      date: d.date.slice(5), // "2023-10-25" -> "10-25"
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
    return planData.ingredients.filter(
      (x) => x.status === 'OUT' || x.status === 'LOW'
    );
  }, [planData]);

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

  return (
    <div className='flex flex-col gap-6 p-6 md:p-8 max-w-[1600px] mx-auto w-full'>
      {/* 1. HEADER */}
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border/40 pb-6'>
        <div className='space-y-1'>
          <h2 className='text-3xl font-bold tracking-tight text-foreground'>
            Demand Intelligence
          </h2>
          <p className='text-sm text-muted-foreground'>
            AI-driven forecasts & stock suggestions for{' '}
            <span className='font-medium text-foreground'>
              {scope === 'next7' ? 'Next 7 Days' : 'Tomorrow'}
            </span>
            .
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={loadAll}
            disabled={loading}
            className='h-9 gap-2'
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <div className='flex bg-muted rounded-md p-1 h-9 items-center'>
            <button
              onClick={() => setScope('tomorrow')}
              className={`text-xs px-3 py-1 rounded-sm transition-all ${
                scope === 'tomorrow'
                  ? 'bg-background shadow-sm font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setScope('next7')}
              className={`text-xs px-3 py-1 rounded-sm transition-all ${
                scope === 'next7'
                  ? 'bg-background shadow-sm font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Next 7 Days
            </button>
          </div>

          <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
            <DialogTrigger asChild>
              <Button
                size='sm'
                className='h-9 gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-sm ml-2'
              >
                <CheckCircle2 className='h-4 w-4' />
                Auto-Generate PO
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Purchase Draft</DialogTitle>
              </DialogHeader>
              <div className='space-y-4 pt-4'>
                <div className='space-y-2'>
                  <Label>Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
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
                <div className='space-y-2'>
                  <Label>Invoice Date</Label>
                  <input
                    type='date'
                    className='w-full rounded-md border bg-background px-3 py-2 text-sm'
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Note</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder='Optional note...'
                  />
                </div>
                <div className='flex justify-end gap-2'>
                  <Button variant='outline' onClick={() => setDraftOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={createDraft}
                    disabled={creating || !suppliers.length}
                    className='bg-orange-600 hover:bg-orange-700 text-white'
                  >
                    {creating ? 'Creating...' : 'Create Draft'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {err && (
        <div className='bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 flex items-center gap-2'>
          <AlertTriangle className='h-4 w-4' /> {err}
        </div>
      )}

      {/* 2. KPI GRID */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Sales Performance */}
        <Card className='shadow-sm border-border/60'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Yesterday's Sales
            </CardTitle>
            <div className='p-2 bg-orange-50 dark:bg-orange-900/20 rounded-full'>
              <TrendingUp className='h-4 w-4 text-orange-600 dark:text-orange-400' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tabular-nums'>
              {historyData?.items
                ? historyData.items.reduce(
                    (acc: number, item: any) =>
                      acc + (item.yesterday_actual || 0),
                    0
                  )
                : 0}{' '}
              <span className='text-sm font-normal text-muted-foreground'>
                units
              </span>
            </div>
            <p className='text-xs text-muted-foreground mt-1 flex items-center gap-1'>
              Predicted:{' '}
              {historyData?.items
                ? historyData.items.reduce(
                    (acc: number, item: any) =>
                      acc + (item.yesterday_pred || 0),
                    0
                  )
                : 0}{' '}
              units
            </p>
          </CardContent>
        </Card>

        {/* Stock Health */}
        <Card className='shadow-sm border-border/60'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Stock Health
            </CardTitle>
            <div
              className={`p-2 rounded-full ${
                ingredientStats.health < 100
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'bg-emerald-50'
              }`}
            >
              <ChefHat
                className={`h-4 w-4 ${
                  ingredientStats.health < 100
                    ? 'text-red-600'
                    : 'text-emerald-600'
                }`}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className='flex justify-between items-end mb-1'>
              <div className='text-2xl font-bold tabular-nums'>
                {ingredientStats.health}%
              </div>
              <span className='text-xs font-medium text-muted-foreground mb-1'>
                {ingredientStats.out + ingredientStats.low} Items at Risk
              </span>
            </div>
            <Progress
              value={ingredientStats.health}
              className='h-1.5 bg-muted'
              indicatorClassName={
                ingredientStats.health < 50 ? 'bg-red-500' : 'bg-emerald-500'
              }
            />
          </CardContent>
        </Card>

        <Card className='shadow-sm border-border/60'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Items Out of Stock
            </CardTitle>
            <div className='p-2 bg-red-50 dark:bg-red-900/20 rounded-full'>
              <AlertTriangle className='h-4 w-4 text-red-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tabular-nums text-red-600'>
              {ingredientStats.out}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Critical Attention
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-sm border-border/60'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Items Low
            </CardTitle>
            <div className='p-2 bg-amber-50 dark:bg-amber-900/20 rounded-full'>
              <Package className='h-4 w-4 text-amber-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tabular-nums text-amber-600'>
              {ingredientStats.low}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Reorder Suggested
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 md:grid-cols-7'>
        {/* 3. CHART: Using ACTUAL DATA  */}
        <Card className='col-span-4 shadow-sm border-border/60'>
          <CardHeader>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div>
                <CardTitle className='text-base font-semibold'>
                  Forecast Accuracy
                </CardTitle>
                <CardDescription className='text-xs'>
                  Actual Sales vs. AI Prediction (Past 14 Days)
                </CardDescription>
              </div>
              <div className='w-[200px]'>
                <Select
                  value={selectedChartId}
                  onValueChange={setSelectedChartId}
                >
                  <SelectTrigger className='h-8 text-xs'>
                    <SelectValue placeholder='Select Item' />
                  </SelectTrigger>
                  <SelectContent>
                    {historyData?.items?.map((x: any) => (
                      <SelectItem
                        key={x.menu_item_id}
                        value={String(x.menu_item_id)}
                      >
                        {x.menu_item_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className='pl-0 pr-4'>
            <div className='h-[320px] w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart
                  data={chartDisplayData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id='colorPredicted'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='5%' stopColor='#f97316' stopOpacity={0.2} />
                      <stop offset='95%' stopColor='#f97316' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    vertical={false}
                    stroke='rgba(0,0,0,0.05)'
                  />
                  <XAxis
                    dataKey='date'
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
                    tick={{ fill: '#64748b' }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      stroke: '#f97316',
                      strokeWidth: 1,
                      strokeDasharray: '4 4',
                    }}
                  />
                  <Legend
                    iconType='circle'
                    fontSize={12}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />

                  {/* Real Data Series */}
                  <Area
                    type='monotone'
                    dataKey='actual'
                    name='Actual Sales'
                    stroke='#94a3b8'
                    strokeWidth={2}
                    strokeDasharray='4 4'
                    fill='transparent'
                    activeDot={{ r: 4, fill: '#94a3b8' }}
                  />
                  <Area
                    type='monotone'
                    dataKey='predicted'
                    name='Predicted'
                    stroke='#f97316'
                    strokeWidth={3}
                    fillOpacity={1}
                    fill='url(#colorPredicted)'
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 4. RISK PANEL: Styled like snippet but using REAL DATA */}
        <Card className='col-span-3 shadow-sm border-border/60 flex flex-col max-h-[450px]'>
          <CardHeader className='pb-3 border-b border-border/40 bg-muted/10'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-base font-semibold flex items-center gap-2'>
                {/* <AlertTriangle className='h-4 w-4 text-amber-500' /> */}
                Inventory Risks
              </CardTitle>
              <div className='flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className='text-xs font-normal bg-background'
                >
                  {riskItems.length} alerts
                </Badge>
                <Button variant='ghost' size='icon' className='h-8 w-8'>
                  <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0 flex-1 overflow-hidden'>
            <div className=''>
              {riskItems.length === 0 && (
                <div className='p-8 text-center text-muted-foreground text-sm'>
                  <CheckCircle2 className='h-8 w-8 mx-auto mb-2 text-emerald-500/50' />
                  All stock levels look healthy!
                </div>
              )}
              {riskItems.slice(0, 2).map((item) => (
                <div
                  key={item.ingredient_id}
                  className='flex flex-col gap-3 p-4 hover:bg-muted/20 transition-colors'
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold text-sm text-foreground'>
                          {item.ingredient_name}
                        </span>
                        <span className='text-[10px] text-muted-foreground font-mono bg-muted px-1 rounded'>
                          {item.sku} ({item.unit})
                        </span>
                      </div>
                      <div className='text-xs text-muted-foreground mt-0.5'>
                        Required:{' '}
                        <span className='font-mono font-medium text-foreground'>
                          {item.required_qty}
                        </span>{' '}
                        | Stock:{' '}
                        <span className='font-mono font-medium text-foreground'>
                          {item.current_stock}
                        </span>
                      </div>
                    </div>

                    {item.status === 'OUT' ? (
                      <Badge
                        variant='destructive'
                        className='font-mono text-[10px]'
                      >
                        OUT
                      </Badge>
                    ) : (
                      <Badge
                        variant='secondary'
                        className='font-mono text-[10px] bg-amber-100 text-amber-800 hover:bg-amber-200'
                      >
                        LOW
                      </Badge>
                    )}
                  </div>

                  {/* Enhanced Purchase Suggestion Box (Snippet Style) */}
                  <div className='bg-orange-50/50 dark:bg-transparent border border-orange-100 rounded-md p-2 flex justify-between items-center'>
                    <span className='text-[11px] font-medium text-orange-800 dark:text-orange-600 flex items-center gap-1.5'>
                      <Package className='h-3 w-3' />
                      Purchase Suggestion
                    </span>
                    <span className='text-sm font-bold text-orange-600'>
                      +{item.suggested_purchase_qty} {item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          {riskItems.length > 2 && (
            <CardFooter className='p-3 border-t border-border/40 bg-muted/5'>
              <Button
                variant='outline'
                size='sm'
                className='w-full h-8 text-xs text-muted-foreground hover:text-foreground'
                onClick={scrollToFullView}
              >
                View Full Forecast Report{' '}
                <ArrowRight className='ml-2 h-3 w-3' />
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* 5. PLAN BREAKDOWN (Detailed Table) */}
      <Card id='full-view' className='shadow-sm border-border/60'>
        <CardHeader className='pb-0'>
          <CardTitle className='text-base font-semibold'>
            Purchase Plan Breakdown
          </CardTitle>
          <CardDescription className='mb-4'>
            Complete ingredient analysis based on {scope} forecast.
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/40 hover:bg-muted/40 text-xs uppercase tracking-wider'>
                <TableHead className='pl-6 h-10'>Ingredient</TableHead>
                <TableHead className='h-10'>Status</TableHead>
                <TableHead className='text-right h-10'>In Stock</TableHead>
                <TableHead className='text-right h-10'>Required</TableHead>
                <TableHead className='text-right h-10'>
                  Remaining (Est)
                </TableHead>
                <TableHead className='text-right h-10 pr-6 text-orange-600 font-bold'>
                  Suggested Buy
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planData?.ingredients?.map((x) => (
                <TableRow
                  key={x.ingredient_id}
                  className='group hover:bg-muted/30'
                >
                  <TableCell className='pl-6 font-medium text-sm'>
                    {x.ingredient_name}
                    <div className='text-xs text-muted-foreground font-normal'>
                      {x.sku} ({x.unit})
                    </div>
                  </TableCell>
                  <TableCell>
                    {x.status === 'OUT' ? (
                      <Badge
                        variant='destructive'
                        className='font-normal text-[10px] uppercase'
                      >
                        Empty
                      </Badge>
                    ) : x.status === 'LOW' ? (
                      <Badge
                        variant='outline'
                        className='font-normal text-[10px] uppercase border-amber-200 text-amber-700 bg-amber-50'
                      >
                        Low
                      </Badge>
                    ) : (
                      <Badge
                        variant='outline'
                        className='font-normal text-[10px] uppercase border-emerald-200 text-emerald-700 bg-emerald-50'
                      >
                        OK
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className='text-right font-mono text-sm text-muted-foreground'>
                    {x.current_stock} ({x.unit})
                  </TableCell>
                  <TableCell className='text-right font-mono text-sm'>
                    {x.required_qty} ({x.unit})
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-sm ${
                      Number(x.projected_remaining) < 0
                        ? 'text-red-500 font-bold'
                        : ''
                    }`}
                  >
                    {x.projected_remaining}
                  </TableCell>
                  <TableCell className='text-right pr-6 font-mono text-sm font-bold text-orange-600'>
                    {Number(x.suggested_purchase_qty) > 0
                      ? `+${x.suggested_purchase_qty}`
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {!planData?.ingredients?.length && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='h-24 text-center text-muted-foreground'
                  >
                    {loading
                      ? 'Loading data...'
                      : 'No ingredients found for this plan.'}
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
