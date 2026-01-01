import { authFetch } from "@/lib/auth";

export type MenuItemMini = { id: number; name: string; price?: string };
export type InventoryItemMini = { id: number; name: string; sku: string; unit: string };

export type RecipeLine = {
  id: number;
  menu_item: number;
  ingredient: number;
  ingredient_name: string;
  ingredient_unit: string;
  ingredient_sku: string;
  qty: string; // per 1 menu item
};

export async function listMenuItemsMini() {
  const res = await authFetch("/api/menu/items/?ordering=name");
  const data = await res.json().catch(() => ([]));
  if (!res.ok) throw data;
  return data as MenuItemMini[];
}

export async function listInventoryItemsMini() {
  const res = await authFetch("/api/inventory/items/?ordering=name");
  const data = await res.json().catch(() => ([]));
  if (!res.ok) throw data;
  // keep only needed fields
  return (data as any[]).map((x) => ({
    id: x.id,
    name: x.name,
    sku: x.sku,
    unit: x.unit,
  })) as InventoryItemMini[];
}

export async function listRecipeLines(menuItemId: number) {
  const res = await authFetch(`/api/menu/recipe-lines/?menu_item=${menuItemId}&ordering=id`);
  const data = await res.json().catch(() => ([]));
  if (!res.ok) throw data;
  return data as RecipeLine[];
}

export async function createRecipeLine(payload: { menu_item: number; ingredient: number; qty: string }) {
  const res = await authFetch("/api/menu/recipe-lines/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as RecipeLine;
}

export async function updateRecipeLine(id: number, payload: { qty?: string; ingredient?: number }) {
  const res = await authFetch(`/api/menu/recipe-lines/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as RecipeLine;
}

export async function deleteRecipeLine(id: number) {
  const res = await authFetch(`/api/menu/recipe-lines/${id}/`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw data;
  }
  return true;
}
