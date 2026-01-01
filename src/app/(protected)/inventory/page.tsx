'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  InventoryItem,
  listInventoryItems,
  createStockMovement,
} from '@/lib/inventory';

import {
  MoreHorizontal,
  Plus,
  Search,
  Package,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Activity,
  ArrowRight,
  Filter,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility

function num(s: string) {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setItems(await listInventoryItems());
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  // --- Actual Value Metrics ---
  const metrics = useMemo(() => {
    const totalItems = items.length;
    const lowStock = items.filter(
      (i) => num(i.current_stock) <= num(i.reorder_level)
    );
    const totalStock = items.reduce(
      (acc, curr) => acc + num(curr.current_stock),
      0
    );

    // Inventory Health: % of items NOT in low stock
    const healthPercentage =
      totalItems > 0 ? ((totalItems - lowStock.length) / totalItems) * 100 : 0;

    return {
      totalItems,
      lowStockCount: lowStock.length,
      totalStock,
      healthPercentage,
    };
  }, [items]);

  // --- Filtering Logic ---
  const filtered = useMemo(() => {
    let result = items;

    if (tabFilter === 'low') {
      result = result.filter(
        (i) => num(i.current_stock) <= num(i.reorder_level)
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, search, tabFilter]);

  // --- Actions ---
  const handleOpenDialog = (item: InventoryItem, actionType: 'IN' | 'OUT') => {
    setSelected(item);
    setType(actionType);
    setQty('1');
    setReason('');
    setNote('');
    setError(null);
    setOpen(true);
  };

  async function submitMovement() {
    if (!selected) return;
    setError(null);

    try {
      await createStockMovement({
        item: selected.id,
        movement_type: type,
        quantity: String(qty),
        reason,
        note,
      });
      setOpen(false);
      setSelected(null);
      await reload();
    } catch (e: any) {
      setError(e?.quantity?.[0] || e?.detail || 'Failed');
    }
  }

  return (
    <div className="flex flex-col gap-8 mx-auto w-full">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Inventory
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Real-time overview of stock levels, reorder points, and automated adjustments.
          </p>
        </div>
        <div className="flex items-center gap-2">
            {/* Optional: Add Export/Import buttons here if needed */}
            <Link href="/inventory/new">
            <Button className="h-10 px-4 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
            </Button>
            </Link>
        </div>
      </div>

      {/* 2. Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Stock */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums tracking-tight">
                {metrics.totalStock.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across <span className="font-medium text-foreground">{metrics.totalItems}</span> unique SKUs
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className={cn("shadow-sm border-border/60 transition-colors", metrics.lowStockCount > 0 && "border-red-200 bg-red-50/10 dark:bg-red-900/10")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attention Needed</CardTitle>
            <AlertCircle className={cn("h-4 w-4", metrics.lowStockCount > 0 ? "text-red-500" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold tabular-nums tracking-tight", metrics.lowStockCount > 0 && "text-red-600 dark:text-red-400")}>
                {metrics.lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Items currently below reorder level
            </p>
          </CardContent>
        </Card>

         {/* Health Score */}
         <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Health</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
                <div className="text-2xl font-bold tabular-nums tracking-tight">
                    {metrics.healthPercentage.toFixed(0)}%
                </div>
            </div>
            <Progress
                value={metrics.healthPercentage}
                className="h-1.5 mt-3 bg-muted"
                // Assuming you have a custom CSS variable for success or hardcoding a class
                indicatorClassName="bg-emerald-500" 
             />
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Content Area */}
      <Card className="shadow-sm border-border/60">
        <Tabs defaultValue="all" onValueChange={setTabFilter} className="w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b">
                {/* Filter Tabs */}
                <TabsList className="bg-muted/50 h-9">
                    <TabsTrigger value="all" className="text-xs">All Products</TabsTrigger>
                    <TabsTrigger value="low" className="text-xs gap-2">
                        Low Stock
                        {metrics.lowStockCount > 0 && (
                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-[9px] font-bold text-red-600 dark:bg-red-900 dark:text-red-200">
                                {metrics.lowStockCount}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Search & Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 text-sm bg-background border-input focus-visible:ring-1"
                        />
                    </div>
                    <Button variant="outline" size="sm" className="h-9 gap-2 hidden sm:flex">
                        <Filter className="h-3.5 w-3.5" />
                        Filters
                    </Button>
                </div>
            </div>

            <TabsContent value="all" className="m-0">
                <InventoryTable items={filtered} onAction={handleOpenDialog} loading={loading} />
            </TabsContent>
            <TabsContent value="low" className="m-0">
                <InventoryTable items={filtered} onAction={handleOpenDialog} loading={loading} />
            </TabsContent>
        </Tabs>
      </Card>

      {/* Action Dialog - Cleaned up form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] gap-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div
                className={cn(
                    "p-2 rounded-lg border",
                    type === 'IN' 
                        ? "bg-green-50 border-green-100 text-green-600" 
                        : "bg-orange-50 border-orange-100 text-orange-600"
                )}
              >
                {type === 'IN' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              </div>
              <span className="font-semibold">{type === 'IN' ? 'Stock In' : 'Stock Out'}</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              Adjusting inventory for <span className="font-medium text-foreground">{selected?.name}</span>.
              Current stock: <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{selected?.current_stock}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="qty" className="text-xs font-semibold uppercase text-muted-foreground">Adjustment Quantity</Label>
              <div className="relative">
                <Input
                    id="qty"
                    type="number"
                    className="font-mono text-lg pl-4 pr-12 h-11"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                />
                <div className="absolute right-3 top-3 text-xs text-muted-foreground font-medium uppercase bg-muted/50 px-1.5 rounded">
                    {selected?.unit}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason" className="text-xs font-semibold uppercase text-muted-foreground">Reason for adjustment</Label>
              <Input
                id="reason"
                placeholder={type === 'IN' ? 'e.g., Supplier Delivery #402' : 'e.g., Kitchen Spoilage'}
                className="h-10"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
                onClick={submitMovement}
                className={cn("min-w-[100px]", type === 'OUT' ? "bg-orange-600 hover:bg-orange-700 text-white" : "")}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Improved Table Component ---
function InventoryTable({
  items,
  onAction,
  loading
}: {
  items: InventoryItem[];
  onAction: (item: InventoryItem, type: 'IN' | 'OUT') => void;
  loading: boolean;
}) {

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Loading inventory data...</div>;
  }

  return (
    <div className="relative w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/60">
            <TableHead className="w-[140px] pl-6 font-medium text-xs uppercase tracking-wider text-muted-foreground">SKU / Code</TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Product</TableHead>
            <TableHead className="text-right font-medium text-xs uppercase tracking-wider text-muted-foreground">On Hand</TableHead>
            <TableHead className="text-center w-[120px] font-medium text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => {
            const stock = num(it.current_stock);
            const reorder = num(it.reorder_level);
            const isLow = stock <= reorder;

            return (
              <TableRow
                key={it.id}
                className="group h-16 hover:bg-muted/40 transition-colors border-border/50"
              >
                {/* SKU */}
                <TableCell className="pl-6 font-mono text-xs font-medium text-muted-foreground">
                  {it.sku}
                </TableCell>

                {/* Product Name & Unit */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-sm text-foreground">{it.name}</span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Package className="h-3 w-3" /> {it.unit} unit
                    </span>
                  </div>
                </TableCell>

                {/* Stock Counts (Right Aligned) */}
                <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                        <span className={cn(
                            "text-sm font-bold tabular-nums",
                            isLow ? "text-red-600 dark:text-red-400" : "text-foreground"
                        )}>
                            {it.current_stock}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                             Min: {it.reorder_level}
                        </span>
                    </div>
                </TableCell>

                {/* Status Badge */}
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={cn(
                        "font-medium border-0 px-2.5 py-0.5",
                        isLow 
                            ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    )}
                  >
                    {isLow ? 'Low Stock' : 'Healthy'}
                  </Badge>
                </TableCell>

                {/* Actions Menu */}
                <TableCell className="pr-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Actions for {it.sku}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onAction(it, 'IN')} className="cursor-pointer">
                        <TrendingUp className="mr-2 h-4 w-4 text-emerald-600" />
                        <span>Add Stock</span>
                        <span className="ml-auto text-xs text-muted-foreground tracking-widest uppercase">IN</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAction(it, 'OUT')} className="cursor-pointer">
                        <TrendingDown className="mr-2 h-4 w-4 text-orange-600" />
                        <span>Remove Stock</span>
                        <span className="ml-auto text-xs text-muted-foreground tracking-widest uppercase">OUT</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/inventory/${it.id}/movements`} className="cursor-pointer w-full flex items-center">
                          <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                          History Log
                          <ArrowRight className="ml-auto h-3 w-3 opacity-50" />
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
          
          {/* Empty State */}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-[400px] text-center"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="rounded-full bg-muted p-4">
                    <Package className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">No items found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    There are no products matching your current filters. Try adjusting your search or add a new item to your inventory.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Reset Filters
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}