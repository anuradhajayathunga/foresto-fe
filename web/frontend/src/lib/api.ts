const ML_BASE = process.env.NEXT_PUBLIC_ML_API_URL ?? "";
const ML_ENDPOINT = ML_BASE.replace(/\/$/, "");

export async function fetchSummary() {
  const res = await fetch(`${ML_ENDPOINT}/analytics/summary`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function fetchRestaurants() {
  const res = await fetch(`${ML_ENDPOINT}/analytics/restaurants`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch restaurants");
  return res.json();
}

export async function fetchItems() {
  const res = await fetch(`${ML_ENDPOINT}/analytics/items`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

export async function fetchHolidays() {
  const res = await fetch(`${ML_ENDPOINT}/analytics/holidays`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch holidays");
  return res.json();
}

export async function fetchWeeklyPattern() {
  const res = await fetch(`${ML_ENDPOINT}/analytics/weekly_pattern`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch weekly pattern");
  return res.json();
}

export async function fetchMonthlyPattern() {
  const res = await fetch(`${ML_ENDPOINT}/analytics/monthly_pattern`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch monthly pattern");
  return res.json();
}

export async function fetchDailySales(restaurant?: string, item?: string) {
  const params = new URLSearchParams();
  if (restaurant) params.set("restaurant", restaurant);
  if (item) params.set("item", item);
  const query = params.toString() ? `?${params}` : "";
  const res = await fetch(`${ML_ENDPOINT}/analytics/daily${query}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch daily sales");
  return res.json();
}

export async function fetchForecastResults(restaurant?: string, item?: string) {
  const params = new URLSearchParams();
  if (restaurant) params.set("restaurant", restaurant);
  if (item) params.set("item", item);
  const query = params.toString() ? `?${params}` : "";
  const res = await fetch(`${ML_ENDPOINT}/forecast/results${query}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch forecast results");
  return res.json();
}

export async function fetchForecastAccuracy() {
  const res = await fetch(`${ML_ENDPOINT}/forecast/accuracy`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch forecast accuracy");
  return res.json();
}

export async function fetchWeather(date: string, location: string) {
  const params = new URLSearchParams({ date, location });
  const res = await fetch(`${ML_ENDPOINT}/weather?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch weather");
  return res.json();
}

export async function fetchCalendar() {
  const res = await fetch(`${ML_ENDPOINT}/calendar`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error("Failed to fetch calendar");
  return res.json();
}

export async function fetchHolidayForDate(date: string) {
  const res = await fetch(
    `${ML_ENDPOINT}/calendar/lookup?date=${encodeURIComponent(date)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { holiday_name: "None", is_holiday: false };
  return res.json();
}

export async function fetchModelInfo() {
  const res = await fetch(`${ML_ENDPOINT}/model/info`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error("Failed to fetch model info");
  return res.json();
}

export async function predictSingle(payload: {
  date: string;
  item: string;
  location: string;
  rainfall_mm?: number;
  temperature?: number;
  holiday_name?: string;
}) {
  const res = await fetch(`${ML_ENDPOINT}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Prediction failed");
  }
  return res.json();
}

export async function aiChat(
  messages: { role: string; content: string }[],
  context?: Record<string, unknown>,
) {
  const res = await fetch(`${ML_ENDPOINT}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }),
  });
  if (!res.ok) throw new Error("AI chat failed");
  return res.json();
}

export async function aiInsights() {
  const res = await fetch(`${ML_ENDPOINT}/ai/insights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error("AI insights failed");
  return res.json();
}

export async function aiExplain(prediction: Record<string, unknown>) {
  const res = await fetch(`${ML_ENDPOINT}/ai/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prediction }),
  });
  if (!res.ok) throw new Error("AI explain failed");
  return res.json();
}

export async function aiRecommend(location?: string) {
  const params = location ? `?location=${encodeURIComponent(location)}` : "";
  const res = await fetch(`${ML_ENDPOINT}/ai/recommend${params}`);
  if (!res.ok) throw new Error("AI recommend failed");
  return res.json();
}

export async function aiForecastNarrative(
  forecastData: unknown[],
  item: string,
  location: string,
) {
  const res = await fetch(`${ML_ENDPOINT}/ai/forecast-narrative`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ forecast_data: forecastData, item, location }),
  });
  if (!res.ok) throw new Error("AI forecast narrative failed");
  return res.json();
}
