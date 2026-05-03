"use client";

import { useState, useEffect } from "react";
import { Download, Trash2, Filter, X, History, ChefHat } from "lucide-react";

const ALL_ITEMS = [
  "All Items",
  "Rice & Curry",
  "Devilled Chicken",
  "Kottu",
  "String Hoppers",
  "Hoppers",
  "Fish Curry",
  "Fried Rice",
  "Lamprais",
  "Egg Roti",
  "Roti",
  "Noodles",
  "Pittu",
  "Short Eats",
  "Juice",
  "Tea / Coffee",
];
const ALL_LOCATIONS = ["All Locations", "Colombo", "Kandy", "Galle", "Negombo"];

interface SavedEntry {
  id: string;
  savedAt: string;
  date: string;
  item: string;
  location: string;
  rainfall_mm: number;
  temperature: number;
  holiday_name: string;
  ml_prediction: number;
  rule_factor: number;
  final_forecast: number;
  rules_applied: { rule: string; factor: number }[];
}

export default function PastPredictionsPage() {
  const [predictions, setPredictions] = useState<SavedEntry[]>([]);
  const [filters, setFilters] = useState({
    item: "All Items",
    location: "All Locations",
    holiday: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("foresto_predictions");
      if (raw) setPredictions(JSON.parse(raw) as SavedEntry[]);
    } catch {
      /* empty storage */
    }
  }, []);

  function setFilter(key: string, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function clearFilters() {
    setFilters({
      item: "All Items",
      location: "All Locations",
      holiday: "",
      dateFrom: "",
      dateTo: "",
    });
  }

  function deleteOne(id: string) {
    const updated = predictions.filter((p) => p.id !== id);
    setPredictions(updated);
    localStorage.setItem("foresto_predictions", JSON.stringify(updated));
  }

  function clearAll() {
    if (!confirm("Delete all saved predictions? This cannot be undone."))
      return;
    setPredictions([]);
    localStorage.removeItem("foresto_predictions");
  }

  const filtered = predictions.filter((p) => {
    if (filters.item !== "All Items" && p.item !== filters.item) return false;
    if (filters.location !== "All Locations" && p.location !== filters.location)
      return false;
    if (
      filters.holiday &&
      !p.holiday_name.toLowerCase().includes(filters.holiday.toLowerCase())
    )
      return false;
    if (filters.dateFrom && p.date < filters.dateFrom) return false;
    if (filters.dateTo && p.date > filters.dateTo) return false;
    return true;
  });

  function printSingle(p: SavedEntry) {
    const w = window.open("", "_blank");
    if (!w) return;

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Prediction ${p.date}</title>
          <style>
            body{font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#111; background:white; padding:24px}
            .header{display:flex;gap:12px;align-items:center;margin-bottom:12px}
            .title{font-weight:700;font-size:18px}
            .muted{color:#6b7280;font-size:12px}
            .card{border:1px solid #eee;padding:16px;border-radius:8px}
            .row{display:flex;justify-content:space-between;padding:6px 0}
            .label{color:#6b7280;font-size:12px}
            .value{font-weight:600}
          </style>
        </head>
        <body>
          <div class="header">
            <div style="width:40px;height:40px;background:#fb923c;border-radius:8px"></div>
            <div>
              <div class="title">Foresto — Prediction</div>
              <div class="muted">Exported ${new Date().toLocaleString()}</div>
            </div>
          </div>
          <div class="card">
            <div class="row"><div class="label">Forecast Date</div><div class="value">${p.date}</div></div>
            <div class="row"><div class="label">Item</div><div class="value">${p.item}</div></div>
            <div class="row"><div class="label">Location</div><div class="value">${p.location}</div></div>
            <div class="row"><div class="label">Event</div><div class="value">${p.holiday_name}</div></div>
            <div class="row"><div class="label">Temp °C</div><div class="value">${p.temperature}</div></div>
            <div class="row"><div class="label">Rain mm</div><div class="value">${p.rainfall_mm}</div></div>
            <div class="row"><div class="label">ML Pred.</div><div class="value">${Number(p.ml_prediction).toFixed(1)}</div></div>
            <div class="row"><div class="label">Rule ×</div><div class="value">×${Number(p.rule_factor).toFixed(2)}</div></div>
            <div class="row"><div class="label">Final Forecast</div><div class="value">${Math.round(p.final_forecast)} units</div></div>
            <div class="row"><div class="label">Saved At</div><div class="value">${new Date(p.savedAt).toLocaleString()}</div></div>
          </div>
        </body>
      </html>`;

    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    setTimeout(() => w.close(), 500);
  }

  function downloadPDF() {
    window.print();
  }

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          aside, .no-print { display: none !important; }
          main { margin-left: 0 !important; padding: 0 !important; }
          body { background: white !important; }
          #print-area { padding: 24px; }
          #print-header { display: flex !important; }
          .print-row:hover { background: transparent !important; }
        }
        @media screen {
          #print-header { display: none; }
        }
      `}</style>

      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Past Predictions
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              View, filter and export your saved demand forecasts
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadPDF}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              Download PDF
            </button>
            <button
              onClick={clearAll}
              disabled={predictions.length === 0}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="section-card no-print">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={14} className="text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">
              Filter Results
            </p>
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition"
            >
              <X size={11} /> Clear filters
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <select
              value={filters.item}
              onChange={(e) => setFilter("item", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400 transition"
            >
              {ALL_ITEMS.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
            <select
              value={filters.location}
              onChange={(e) => setFilter("location", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400 transition"
            >
              {ALL_LOCATIONS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Event / Holiday..."
              value={filters.holiday}
              onChange={(e) => setFilter("holiday", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition"
            />
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 ml-1">
                Date from
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilter("dateFrom", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 ml-1">
                Date to
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilter("dateTo", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition"
              />
            </div>
          </div>
        </div>

        {/* Print header (visible only when printing) */}
        <div
          id="print-header"
          className="items-center gap-3 mb-6 pb-4 border-b border-gray-200"
        >
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <ChefHat size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900">
              Foresto — Past Predictions
            </p>
            <p className="text-xs text-gray-500">
              Exported {new Date().toLocaleString()}
            </p>
          </div>
        </div>

        {/* Table */}
        <div id="print-area">
          <p className="text-sm text-gray-500 mb-3 no-print">
            {filtered.length} prediction{filtered.length !== 1 ? "s" : ""}
            {predictions.length !== filtered.length &&
              ` (filtered from ${predictions.length})`}
          </p>

          {filtered.length === 0 ? (
            <div className="section-card h-56 flex flex-col items-center justify-center gap-3 no-print">
              <History size={36} className="text-gray-200" />
              <p className="text-sm text-gray-400 text-center">
                {predictions.length === 0
                  ? "No saved predictions yet.\nRun a forecast on the Predict page and click Save Prediction."
                  : "No predictions match the current filters."}
              </p>
            </div>
          ) : (
            <div className="section-card p-0 overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "Forecast Date",
                      "Item",
                      "Location",
                      "Event",
                      "Temp °C",
                      "Rain mm",
                      "ML Pred.",
                      "Rule ×",
                      "Final Forecast",
                      "Saved At",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap ${i === 10 ? "no-print" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="print-row hover:bg-orange-50/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {p.date}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{p.item}</td>
                      <td className="px-4 py-3 text-gray-700">{p.location}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {p.holiday_name === "None" ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          p.holiday_name
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.temperature}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.rainfall_mm}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {Number(p.ml_prediction).toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        ×{Number(p.rule_factor).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-orange-600 text-base">
                          {Math.round(p.final_forecast)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          units
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(p.savedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 no-print flex items-center gap-2">
                        <button
                          onClick={() => printSingle(p)}
                          title="Download this prediction as PDF"
                          className="text-blue-500 hover:text-blue-700 transition"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          onClick={() => deleteOne(p.id)}
                          title="Delete this prediction"
                          className="text-gray-300 hover:text-red-500 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
