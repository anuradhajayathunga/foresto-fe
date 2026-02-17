import { authFetch } from "@/lib/auth";
export type IngredientPlan = {
  scope: "tomorrow" | "next7";
  horizon_days: number;
  start_date: string;
  items_missing_recipes: { menu_item_id: number; menu_item_name: string }[];
  ingredients: {
    ingredient_id: number;
    ingredient_name: string;
    sku: string;
    unit: string;
    current_stock: string;
    reorder_level: string;
    required_qty: string;
    projected_remaining: string;
    status: "OK" | "LOW" | "OUT";
    suggested_purchase_qty: string;
    contributes?: {
      menu_item_id: number;
      menu_item_name: string;
      predicted_units: number;
      per_unit_qty: string;
      required_qty: string;
    }[];
  }[];
};
export async function getDemandForecast(horizon_days = 7, top_n = 50) {
  const res = await authFetch(`/api/forecasting/demand/?horizon_days=${horizon_days}&top_n=${top_n}`, {
    method: "GET",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export async function getForecastHistory(days = 14, top_n = 50) {
  const res = await authFetch(`/api/forecasting/history/?days=${days}&top_n=${top_n}`, { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as {
    start_date: string;
    end_date: string;
    days: number;
    items: {
      menu_item_id: number;
      menu_item_name: string;
      yesterday_actual: number;
      yesterday_pred: number;
      yesterday_diff: number;
      daily: { date: string; yhat: number; actual: number }[];
    }[];
  };
}

export async function getIngredientPlan(scope: "tomorrow" | "next7" = "next7", horizon_days = 7, top_n = 50) {
  const res = await authFetch(
    `/api/forecasting/ingredients_plan/?scope=${scope}&horizon_days=${horizon_days}&top_n=${top_n}`,
    { method: "GET" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as {
    scope: string;
    horizon_days: number;
    start_date: string;
    items_missing_recipes: { menu_item_id: number; menu_item_name: string }[];
    ingredients: {
      ingredient_id: number;
      ingredient_name: string;
      sku: string;
      unit: string;
      current_stock: string;
      reorder_level: string;
      required_qty: string;
      projected_remaining: string;
      status: "OK" | "LOW" | "OUT";
      suggested_purchase_qty: string;
    }[];
  };
}