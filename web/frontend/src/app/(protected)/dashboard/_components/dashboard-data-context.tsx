'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { listSales, type Sale } from '@/lib/sales';
import { getLowStockItems, type InventoryItem } from '@/lib/inventory';
import {
  listProductions,
  listWastes,
  type KitchenProduction,
  type KitchenWaste,
} from '@/lib/kitchen';
import { type AlertEntry, type AlertLevel } from './alerts-section';
import { type ActivityItem } from './activity-list';

// --- Utilities ---

const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Safely formats a Date to YYYY-MM-DD in the local timezone */
const toLocalDateString = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

/** Standard SaaS currency formatter */
const formatCurrency = (amount: number, currency = 'LKR') => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// --- Types ---

export type DashboardContextData = {
  loading: boolean;
  fetchError: string | null;
  totalTodaySales: number;
  totalAllSales: number;
  totalPlanned: number;
  totalPrepared: number;
  totalWaste: number;
  wasteRate: number;
  lowStockCount: number;
  lowStockItems: InventoryItem[];
  alerts: AlertEntry[];
  activities: ActivityItem[];
};

const DashboardDataContext = createContext<DashboardContextData | null>(null);

// --- Provider ---

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [productions, setProductions] = useState<KitchenProduction[]>([]);
  const [wastes, setWastes] = useState<KitchenWaste[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 1. Data Fetching Phase
  useEffect(() => {
    let mounted = true;
    
    const fetchDashboardData = async () => {
      const today = new Date();
      const todayStr = toLocalDateString(today);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = toLocalDateString(weekAgo);

      try {
        const results = await Promise.allSettled([
          listSales(),
          getLowStockItems(),
          listProductions({ date_from: weekAgoStr, date_to: todayStr }),
          listWastes({ date_from: weekAgoStr, date_to: todayStr }),
        ]);

        if (!mounted) return;

        const [salesRes, lowStockRes, prodRes, wasteRes] = results;

        if (salesRes.status === 'fulfilled') setSales(salesRes.value);
        if (lowStockRes.status === 'fulfilled') setLowStock(lowStockRes.value);
        if (prodRes.status === 'fulfilled') setProductions(prodRes.value);
        if (wasteRes.status === 'fulfilled') setWastes(wasteRes.value);

        // Graceful degradation: Only show a total error if ALL vital requests fail
        if (results.every((r) => r.status === 'rejected')) {
          setFetchError('Failed to load dashboard data. Please check your connection.');
        }
      } catch (error) {
        if (mounted) setFetchError('An unexpected error occurred while loading data.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Data Transformation Phase
  const value = useMemo<DashboardContextData>(() => {
    const todayStr = toLocalDateString(new Date());

    // Filter sales for today safely
    const todaySales = sales.filter((s) => {
      if (!s.sold_at && !s.created_at) return false;
      try {
        return toLocalDateString(new Date(String(s.sold_at || s.created_at))) === todayStr;
      } catch {
        return false;
      }
    });

    // Aggregations
    const totalTodaySales = todaySales.reduce((sum, s) => sum + toNum(s.total), 0);
    const totalAllSales = sales.reduce((sum, s) => sum + toNum(s.total), 0);
    const totalPlanned = productions.reduce((sum, p) => sum + toNum(p.planned_qty), 0);
    const totalPrepared = productions.reduce((sum, p) => sum + toNum(p.prepared_qty), 0);
    const totalWaste = wastes.reduce((sum, w) => sum + toNum(w.waste_qty), 0);
    
    const wasteRate = totalPrepared > 0 ? (totalWaste / totalPrepared) * 100 : 0;
    const lowStockCount = lowStock.length;

    // Build Alerts
    const alerts: AlertEntry[] = [];
    
    if (lowStockCount > 0) {
      alerts.push({
        level: 'warning',
        title: `${lowStockCount} ${lowStockCount === 1 ? 'Item' : 'Items'} Low in Stock`,
        message: 'Review inventory and create purchase orders to maintain adequate stock.',
        action: { label: 'View Inventory', href: '/inventory' },
      });
    }
    
    if (wasteRate > 5) {
      alerts.push({
        level: 'error', // Elevated from warning for SaaS urgency
        title: `High Waste Rate (${wasteRate.toFixed(1)}%)`,
        message: 'Review kitchen practices and wastage trends to reduce losses.',
        action: { label: 'View Kitchen Ops', href: '/kitchen' },
      });
    }
    
    if (totalPlanned > 0 && totalPrepared === 0) {
      alerts.push({
        level: 'info',
        title: 'Pending Production',
        message: `${totalPlanned.toFixed(0)} units planned. Awaiting kitchen preparation.`,
        action: { label: 'View Schedule', href: '/kitchen' },
      });
    }

    // Build Activity Feed (Declarative mapping)
    const salesActivities: ActivityItem[] = todaySales.slice(0, 5).map((sale) => ({
      id: `sale-${sale.id}`,
      type: 'sale',
      title: `Order #${sale.id} ${sale.status.toLowerCase()}`,
      description: `${formatCurrency(toNum(sale.total))} via ${sale.payment_method}`,
      timestamp: String(sale.sold_at || sale.created_at || new Date().toISOString()),
      status: sale.status === 'PAID' ? 'completed' : sale.status === 'VOID' ? 'warning' : 'pending',
    }));

    const prodActivities: ActivityItem[] = productions.slice(0, 3).map((prod) => {
      const isComplete = toNum(prod.prepared_qty) >= toNum(prod.planned_qty) && toNum(prod.planned_qty) > 0;
      return {
        id: `prod-${prod.id}`,
        type: 'production',
        title: `${prod.menu_item_name ?? `Item #${prod.menu_item}`} preparation`,
        description: `Target: ${prod.planned_qty} | Prepared: ${prod.prepared_qty}`,
        timestamp: String(prod.updated_at ?? prod.created_at ?? prod.date),
        status: isComplete ? 'completed' : 'pending',
      };
    });

    const combinedActivities = [...salesActivities, ...prodActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);

    return {
      loading,
      fetchError,
      totalTodaySales,
      totalAllSales,
      totalPlanned,
      totalPrepared,
      totalWaste,
      wasteRate,
      lowStockCount,
      lowStockItems: lowStock.slice(0, 5),
      alerts,
      activities: combinedActivities,
    };
  }, [loading, fetchError, sales, lowStock, productions, wastes]);

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

// --- Hook ---

export function useDashboardData(): DashboardContextData {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return ctx;
}