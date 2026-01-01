import { authFetch } from "@/lib/auth";

export type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  unit: "PCS" | "KG" | "G" | "L" | "ML";
  current_stock: string;
  reorder_level: string;
  cost_per_unit: string;
  is_active: boolean;
};

export type StockMovement = {
  id: number;
  created_at: string;
  item: number;
  item_name: string;
  item_sku: string;
  movement_type: "IN" | "OUT" | "ADJUST";
  quantity: string;
  reason: string;
  note: string;
  created_by_email: string;
};

export async function listInventoryItems() {
  const res = await authFetch("/api/inventory/items/?ordering=name");
  const data = await res.json().catch(() => ([]));
  if (!res.ok) throw data;
  return data as InventoryItem[];
}

export async function createInventoryItem(payload: Partial<InventoryItem>) {
  const res = await authFetch("/api/inventory/items/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as InventoryItem;
}

export async function createStockMovement(payload: {
  item: number;
  movement_type: "IN" | "OUT" | "ADJUST";
  quantity: string;
  reason?: string;
  note?: string;
}) {
  const res = await authFetch("/api/inventory/movements/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export async function listMovements(itemId: number) {
  const res = await authFetch(`/api/inventory/movements/?item=${itemId}&ordering=-created_at`);
  const data = await res.json().catch(() => ([]));
  if (!res.ok) throw data;
  return data as StockMovement[];
}

export async function getLowStockItems() {
  const res = await authFetch("/api/inventory/items/low_stock/");
  const data = await res.json().catch(() => ([]));
  if (!res.ok) throw data;
  return data as InventoryItem[];
}