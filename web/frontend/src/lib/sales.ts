import { authFetch, unwrapList } from '@/lib/auth';

export type Sale = {
  id: number;
  menu_item: number;
  menu_item_name?: string;
  quantity: string;
  unit_price?: string;
  total_amount?: string;
  sold_at?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  created_at?: string;
};

export async function createSale(payload: {
  menu_item: number;
  quantity: string;
  sold_at?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}) {
  const res = await authFetch('/api/sales/sales/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as Sale;
}

export async function listSales() {
  const res = await authFetch('/api/sales/sales/?ordering=-created_at');
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return unwrapList<Sale>(data);
}

export async function getSale(id: number) {
  const res = await authFetch(`/api/sales/sales/${id}/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as Sale;
}

export async function getSalesSummary(days = 7) {
  const res = await authFetch(`/api/sales/sales/summary/?days=${days}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as {
    period_days: number;
    total_revenue: string;
    total_qty: string;
    by_item: Array<{ menu_item: number; menu_item_name: string; qty: string; revenue: string }>;
    by_day: Array<{ day: string; qty: string; revenue: string }>;
  };
}
