import { authFetch, unwrapList } from "@/lib/auth";

export type Sale = {
  id: number;
  menu_item: number;
  menu_item_name?: string;
  quantity: string;
  unit_price?: string;
  total_amount?: string;
  sold_at?: string;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED";
  created_at?: string;
};

export type SaleItemInput = { menu_item: number; qty: number };

export async function createSale(payload: {
  customer_name?: string;
  payment_method: "CASH" | "CARD" | "ONLINE";
  discount?: string;
  tax?: string;
  notes?: string;
  status?: string;
  items: SaleItemInput[];
}) {
  const res = await authFetch("/api/sales/sales/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as { id: number };
}

export async function listSales() {
  const res = await authFetch('/api/sales/sales/?ordering=-created_at');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as any[];
}

export async function getSale(id: string) {
  const res = await authFetch(`/api/sales/sales/${id}/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export async function getSalesSummary(days: number) {
  const res = await authFetch(`/api/sales/sales/summary/?days=${days}`);
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return data as { date: string; count: number; total: string }[];
}
