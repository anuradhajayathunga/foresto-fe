import { authFetch, unwrapList } from "@/lib/auth";

export type Sale = {
  id: number;
  restaurant?: number;
  customer_name?: string;
  subtotal?: string;
  discount?: string;
  tax?: string;
  total: string;
  items?: Array<{
    id: number;
    menu_item?: number | null;
    menu_item_name?: string | null;
    name: string;
    qty: number | string;
    unit_price?: string;
    line_total?: string;
  }>;
  sold_at?: string;
  payment_method: "CASH" | "CARD" | "ONLINE";
  status: "PAID" | "VOID" | "DRAFT";
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
  return unwrapList<Sale>(data);
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
