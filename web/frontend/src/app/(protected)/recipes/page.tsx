'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createRecipeLine,
  deleteRecipeLine,
  listInventoryItemsMini,
  listMenuItemsMini,
  listRecipeLines,
  updateRecipeLine,
  InventoryItemMini,
  MenuItemMini,
  RecipeLine,
} from '@/lib/recipes';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  ChefHat,
  Scale,
  TrendingUp,
  Loader2,
  ArrowRight,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  FileDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CsvImporter } from '@/components/csv-importer';

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function RecipesPage() {
  const [menuItems, setMenuItems] = useState<MenuItemMini[]>([]);
  const [invItems, setInvItems] = useState<InventoryItemMini[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [lines, setLines] = useState<RecipeLine[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Dialog States
  const [addOpen, setAddOpen] = useState(false);
  const [addIngredientId, setAddIngredientId] = useState<string>('');
  const [addQty, setAddQty] = useState('1');
  const [addErr, setAddErr] = useState<string | null>(null);
  const [savingAdd, setSavingAdd] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editLine, setEditLine] = useState<RecipeLine | null>(null);
  const [editQty, setEditQty] = useState('1');
  const [editErr, setEditErr] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lineToDelete, setLineToDelete] = useState<RecipeLine | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --- Derived Data ---
  const selectedMenu = useMemo(() => {
    const id = Number(selectedMenuId || 0);
    return menuItems.find((m) => m.id === id) || null;
  }, [menuItems, selectedMenuId]);

  const invMap = useMemo(() => {
    const m = new Map<number, InventoryItemMini>();
    invItems.forEach((it) => m.set(it.id, it));
    return m;
  }, [invItems]);

  const financials = useMemo(() => {
    // Mock cost generation (stable per ID)
    const getMockCost = (id: number) => (id % 10) * 50 + 50;

    const totalCost = lines.reduce((acc, line) => {
      const costPerUnit = getMockCost(line.ingredient);
      return acc + costPerUnit * Number(line.qty);
    }, 0);

    const sellingPrice = selectedMenu ? Number(selectedMenu.price || 2500) : 0;
    const profit = sellingPrice - totalCost;
    const foodCostPercentage =
      sellingPrice > 0 ? (totalCost / sellingPrice) * 100 : 0;

    return { totalCost, sellingPrice, profit, foodCostPercentage };
  }, [lines, selectedMenu]);

  // --- Data Loading ---
  async function loadBase() {
    try {
      const [m, i] = await Promise.all([
        listMenuItemsMini(),
        listInventoryItemsMini(),
      ]);
      setMenuItems(m);
      setInvItems(i);
      if (!selectedMenuId && m.length) setSelectedMenuId(String(m[0].id));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  async function loadLines(menuId: number) {
    setLoadingLines(true);
    try {
      const data = await listRecipeLines(menuId);
      setLines(data);
    } catch (error) {
      console.error('Failed to load recipe lines:', error);
    } finally {
      setLoadingLines(false);
    }
  }

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    const id = Number(selectedMenuId || 0);
    if (id) loadLines(id);
  }, [selectedMenuId]);

  // --- Handlers ---
  async function onAddLine() {
    setAddErr(null);
    const menuId = Number(selectedMenuId || 0);
    const ingredientId = Number(addIngredientId || 0);

    if (!menuId) return setAddErr('Select a menu item.');
    if (!ingredientId) return setAddErr('Select an ingredient.');
    if (num(addQty) <= 0) return setAddErr('Quantity must be greater than 0.');

    setSavingAdd(true);
    try {
      await createRecipeLine({
        menu_item: menuId,
        ingredient: ingredientId,
        qty: num(addQty).toFixed(2),
      });
      setAddOpen(false);
      setAddIngredientId('');
      setAddQty('1');
      await loadLines(menuId);
    } catch (e: any) {
      setAddErr(e?.detail || 'Failed to add ingredient');
    } finally {
      setSavingAdd(false);
    }
  }

  async function onSaveEdit() {
    if (!editLine) return;
    setEditErr(null);
    if (num(editQty) <= 0)
      return setEditErr('Quantity must be greater than 0.');
    setSavingEdit(true);
    try {
      await updateRecipeLine(editLine.id, { qty: num(editQty).toFixed(2) });
      setEditOpen(false);
      setEditLine(null);
      await loadLines(Number(selectedMenuId));
    } catch (e: any) {
      setEditErr(e?.detail || 'Update failed');
    } finally {
      setSavingEdit(false);
    }
  }

  function openEdit(line: RecipeLine) {
    setEditLine(line);
    setEditQty(String(line.qty));
    setEditOpen(true);
  }

  function onDeleteClick(line: RecipeLine) {
    setLineToDelete(line);
    setDeleteOpen(true);
  }

  async function onConfirmDelete() {
    if (!lineToDelete) return;
    setDeleting(true);
    try {
      await deleteRecipeLine(lineToDelete.id);
      await loadLines(Number(selectedMenuId));
      setDeleteOpen(false);
      setLineToDelete(null);
    } catch (e: any) {
      console.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className='flex flex-col gap-8  mx-auto w-full'>
      {/* 1. Header & Context Switcher */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-6 max-w-5xl'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Recipe Engineering
          </h1>
          <p className='text-sm text-muted-foreground max-w-2xl'>
            Configure detailed ingredient breakdowns and analyze real-time food
            costs against your selling price.
          </p>
        </div>

        {/* Global Context Switcher */}
        <div className='flex flex-col sm:flex-row sm:items-end gap-3 w-full md:w-auto'>
          <div className='w-full md:w-[300px] space-y-2'>
            <Label className='text-xs uppercase tracking-wider text-muted-foreground font-semibold'>
              Active Menu Item
            </Label>

            <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
              <SelectTrigger className='h-11  shadow-sm border-border bg-background w-full'>
                <SelectValue placeholder='Select Item to Edit' />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Menu Items</SelectLabel>
                  {menuItems.map((m) => (
                    <SelectItem
                      key={m.id}
                      value={String(m.id)}
                      className='cursor-pointer'
                    >
                      <span className='font-medium'>{m.name}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='h-9 w-full sm:w-auto'
              >
                <FileDown className='h-4 w-4 mr-2' />
                Import
              </Button>
            </DialogTrigger>

            <DialogContent className='sm:max-w-xl'>
              <DialogHeader>
                <DialogTitle>Bulk Data Import</DialogTitle>
              </DialogHeader>

              <DialogFooter className='py-2'>
                <CsvImporter
                  kind='recipes'
                  title='Import Menu Recipes'
                  description='Upload CSV to bulk update.'
                />
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        {/* 2. LEFT: Recipe Composition (8 columns) */}
        <div className='lg:col-span-8 space-y-6'>
          <Card className='shadow-sm border-border/60 min-h-[550px] flex flex-col'>
            <CardHeader className='flex flex-row items-center justify-between pb-4 border-b border-border/40'>
              <div className='space-y-1'>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <ChefHat className='h-5 w-5 text-primary' />
                  Composition
                </CardTitle>
                <CardDescription>
                  Define ingredients for a single serving of{' '}
                  <span className='font-medium text-foreground'>
                    {selectedMenu?.name || '...'}
                  </span>
                </CardDescription>
              </div>

              <Dialog
                open={addOpen}
                onOpenChange={(v) => {
                  setAddOpen(v);
                  if (!v) setAddErr(null);
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    size='sm'
                    className='gap-2'
                    disabled={!selectedMenuId}
                  >
                    <Plus className='h-4 w-4' /> Add Ingredient
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Ingredient</DialogTitle>
                    <DialogDescription>
                      Link an inventory item to this recipe.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label>Inventory Item</Label>
                      <Select
                        value={addIngredientId}
                        onValueChange={setAddIngredientId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Search inventory...' />
                        </SelectTrigger>
                        <SelectContent className='max-h-[200px]'>
                          {invItems.map((i) => (
                            <SelectItem key={i.id} value={String(i.id)}>
                              {i.name}{' '}
                              <span className='text-muted-foreground text-xs ml-1'>
                                ({i.unit})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label>Quantity Required</Label>
                      <div className='flex items-center gap-2'>
                        <Input
                          type='number'
                          value={addQty}
                          onChange={(e) => setAddQty(e.target.value)}
                          className='font-mono'
                        />
                        {addIngredientId && (
                          <Badge
                            variant='outline'
                            className='h-10 px-3 text-sm font-normal text-muted-foreground bg-muted/50'
                          >
                            {invMap.get(Number(addIngredientId))?.unit}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {addErr && (
                      <p className='text-sm text-destructive font-medium bg-destructive/10 p-2 rounded'>
                        {addErr}
                      </p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant='outline' onClick={() => setAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={onAddLine} disabled={savingAdd}>
                      {savingAdd ? 'Adding...' : 'Confirm Add'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent className='p-0 flex-1'>
              {loadingLines ? (
                <div className='flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground'>
                  <Loader2 className='h-8 w-8 animate-spin text-primary/50' />
                  <span className='text-sm'>
                    Retrieving composition data...
                  </span>
                </div>
              ) : lines.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground'>
                  <div className='p-4 rounded-full bg-muted/50'>
                    <Scale className='h-8 w-8 opacity-40' />
                  </div>
                  <div className='text-center space-y-1'>
                    <p className='font-medium text-foreground'>
                      No ingredients defined
                    </p>
                    <p className='text-xs max-w-xs mx-auto'>
                      Start by adding ingredients from your inventory to
                      calculate the cost of this dish.
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className='bg-muted/30 hover:bg-muted/30 border-b border-border/60'>
                      <TableHead className='pl-6 w-[40%]'>Ingredient</TableHead>
                      <TableHead className='text-right'>Qty Needed</TableHead>
                      <TableHead className='text-right'>
                        Unit Cost (Est.)
                      </TableHead>
                      <TableHead className='text-right w-[100px] pr-6'>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((l) => (
                      <TableRow
                        key={l.id}
                        className='group hover:bg-muted/40 transition-colors'
                      >
                        <TableCell className='pl-6 font-medium'>
                          <div className='flex flex-col'>
                            <span className='text-foreground'>
                              {l.ingredient_name}
                            </span>
                            <span className='text-[11px] text-muted-foreground font-mono'>
                              SKU: {l.ingredient_sku}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          <span className='font-mono font-medium text-foreground'>
                            {l.qty}
                          </span>
                          <span className='text-xs text-muted-foreground ml-1'>
                            {l.ingredient_unit}
                          </span>
                        </TableCell>
                        <TableCell className='text-right font-mono text-muted-foreground'>
                          {/* Mock unit cost display for UI demo */}
                          LKR {((l.ingredient % 10) * 50 + 50).toFixed(2)}
                        </TableCell>
                        <TableCell className='text-right pr-6'>
                          <div className='flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 hover:bg-background border hover:border-border'
                              onClick={() => openEdit(l)}
                            >
                              <Pencil className='h-3.5 w-3.5 text-muted-foreground' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 hover:bg-red-50 hover:text-red-600 hover:border-red-100'
                              onClick={() => onDeleteClick(l)}
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>

            {lines.length > 0 && (
              <CardFooter className='bg-muted/20 border-t border-border/40 py-3 px-6 flex justify-between text-xs text-muted-foreground'>
                <span>{lines.length} Ingredients</span>
                <span>Last updated: Just now</span>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* 3. RIGHT: Financial Analysis (4 columns) */}
        <div className='lg:col-span-4 space-y-6 sticky top-6'>
          {/* Cost Sheet Card */}
          <Card className='shadow-md border-border/80 overflow-hidden'>
            <div className='bg-muted/50 p-4 border-b border-border/60 flex items-center gap-2'>
              <Calculator className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm font-semibold text-foreground uppercase tracking-wider'>
                Cost Sheet
              </span>
            </div>

            <CardContent className='p-0'>
              {/* Primary Numbers */}
              <div className='p-6 space-y-6'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    Selling Price
                  </span>
                  <span className='text-lg font-mono font-medium'>
                    LKR {financials.sellingPrice.toFixed(2)}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-muted-foreground'>
                      Total Cost (COGS)
                    </span>
                  </div>
                  <span className='text-lg font-mono font-medium text-destructive'>
                    - LKR {financials.totalCost.toFixed(2)}
                  </span>
                </div>

                <Separator />

                <div className='flex items-end justify-between'>
                  <div className='space-y-1'>
                    <span className='text-sm font-semibold text-foreground'>
                      Net Profit
                    </span>
                    <p className='text-xs text-muted-foreground'>
                      Per serving sold
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-2xl font-mono font-bold',
                      financials.profit > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-destructive'
                    )}
                  >
                    LKR {financials.profit.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Meter Section */}
              <div className='bg-muted/30 p-6 border-t border-border/60'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-xs font-semibold uppercase text-muted-foreground'>
                    Food Cost %
                  </span>
                  <span
                    className={cn(
                      'text-sm font-bold font-mono',
                      financials.foodCostPercentage > 35
                        ? 'text-destructive'
                        : 'text-emerald-600'
                    )}
                  >
                    {financials.foodCostPercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(financials.foodCostPercentage, 100)}
                  className='h-2'
                  indicatorClassName={
                    financials.foodCostPercentage > 35
                      ? 'bg-destructive'
                      : 'bg-emerald-500'
                  }
                />
                <div className='flex justify-between mt-2 text-[10px] text-muted-foreground'>
                  <span>0%</span>
                  <span>Target: 30%</span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Status Ribbon */}
          {lines.length > 0 && (
            <div
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border',
                financials.foodCostPercentage > 40
                  ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-200'
                  : financials.foodCostPercentage > 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:text-emerald-200'
                  : 'bg-muted border-border'
              )}
            >
              {financials.foodCostPercentage > 40 ? (
                <AlertTriangle className='h-5 w-5 shrink-0' />
              ) : (
                <CheckCircle2 className='h-5 w-5 shrink-0' />
              )}
              <div>
                <p className='text-sm font-semibold'>
                  {financials.foodCostPercentage > 40
                    ? 'Margin Warning'
                    : 'Healthy Margin'}
                </p>
                <p className='text-xs opacity-90'>
                  {financials.foodCostPercentage > 40
                    ? 'Food cost exceeds 40% of price.'
                    : 'Food cost is within profitable range.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Adjust Quantity</DialogTitle>
            <DialogDescription>
              Update amount for{' '}
              <span className='font-medium text-foreground'>
                {editLine?.ingredient_name}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className='py-4 space-y-4'>
            <div className='space-y-2'>
              <Label>Quantity ({editLine?.ingredient_unit})</Label>
              <Input
                type='number'
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                className='font-mono text-lg'
              />
            </div>
            {editErr && <p className='text-sm text-destructive'>{editErr}</p>}
          </div>
          <DialogFooter>
            <Button variant='ghost' onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSaveEdit} disabled={savingEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Ingredient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{' '}
              <span className='font-medium text-foreground'>
                {lineToDelete?.ingredient_name}
              </span>{' '}
              from the recipe. The Total Cost and Food Cost % will be
              recalculated immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirmDelete();
              }}
              disabled={deleting}
              className='bg-destructive hover:bg-destructive/90'
            >
              {deleting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Confirm Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
