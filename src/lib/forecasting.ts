import { authFetch } from "@/lib/auth";

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