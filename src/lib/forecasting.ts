import { authFetch } from "@/lib/auth";

export async function getDemandForecast(horizon_days = 7, top_n = 50) {
  const res = await authFetch(`/api/forecasting/demand/?horizon_days=${horizon_days}&top_n=${top_n}`, {
    method: "GET",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}
