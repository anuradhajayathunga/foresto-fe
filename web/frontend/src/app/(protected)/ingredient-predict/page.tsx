"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL + "/api/ingredients";

export default function IngredientPredictPage() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredient, setIngredient] = useState("");
  const [month, setMonth] = useState("");
  const [weekOfMonth, setWeekOfMonth] = useState("");
  const [year, setYear] = useState("");
  const [predictions, setPredictions] = useState<
    { ingredient: string; price: number }[] | null
  >(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/commodities/`)
      .then((res) => res.json())
      .then((data) => setIngredients(data.commodities))
      .catch(() => console.log("Failed to load ingredients"));
  }, []);

  const getGlobalWeek = (month: number, weekOfMonth: number) => {
    return (month - 1) * 4 + weekOfMonth - 1;
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const globalWeek = getGlobalWeek(Number(month), Number(weekOfMonth));

    if (ingredient === "ALL") {
      // 🔹 Loop through all ingredients
      const results = await Promise.all(
        ingredients.map(async (ing) => {
          const res = await fetch(`${API}/predict/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ingredient: ing, week: globalWeek, year }),
          });
          const data = await res.json();
          return { ingredient: ing, price: data.predicted_price };
        })
      );
      setPredictions(results);
    } else {
      // 🔹 Single ingredient
      const res = await fetch(`${API}/predict/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient, week: globalWeek, year }),
      });
      const data = await res.json();
      setPredictions([{ ingredient, price: data.predicted_price }]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--color-dark-2)] text-gray-100 p-8">
      <div className="w-full max-w-xl bg-[color:var(--color-dark-3)] border border-[color:var(--color-dark-4)] rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Ingredient Price Prediction
        </h1>

        <form onSubmit={handlePredict} className="flex flex-col gap-4">
          {/* Ingredient Dropdown */}
          <select
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
            required
            className="p-3 bg-[color:var(--color-dark-4)] border border-[color:var(--color-dark-5)] rounded text-gray-100"
          >
            <option value="">Select Ingredient</option>
            <option value="ALL">All Ingredients</option>
            {ingredients.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>

          {/* Month Dropdown */}
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
            className="p-3 bg-[color:var(--color-dark-4)] border border-[color:var(--color-dark-5)] rounded text-gray-100"
          >
            <option value="">Select Month</option>
            {[...Array(12)].map((_, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {new Date(0, idx).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>

          {/* Week Dropdown */}
          <select
            value={weekOfMonth}
            onChange={(e) => setWeekOfMonth(e.target.value)}
            required
            className="p-3 bg-[color:var(--color-dark-4)] border border-[color:var(--color-dark-5)] rounded text-gray-100"
          >
            <option value="">Select Week of Month</option>
            <option value="1">Week 1</option>
            <option value="2">Week 2</option>
            <option value="3">Week 3</option>
            <option value="4">Week 4</option>
          </select>

          {/* Year Input */}
          <input
            type="number"
            placeholder="Enter Year (e.g. 2026)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            className="p-3 bg-[color:var(--color-dark-4)] border border-[color:var(--color-dark-5)] rounded text-gray-100"
          />

          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded font-semibold"
          >
            {loading ? "Predicting..." : "Predict Price"}
          </button>
        </form>

        {/* Results */}
        {predictions && (
          <div className="mt-8 space-y-4">
            {predictions.map((p, idx) => (
              <div
                key={idx}
                className="p-4 border border-[color:var(--color-dark-5)] rounded bg-[color:var(--color-dark-4)] text-center"
              >
                <p className="text-gray-300 text-sm">{p.ingredient}</p>
                <h2 className="text-2xl font-bold text-orange-400">
                  Rs. {p.price.toFixed(2)}
                </h2>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
