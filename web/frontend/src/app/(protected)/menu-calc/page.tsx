"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL + "/api/ingredients";

export default function MenuPriceCalculator() {
  const [dish, setDish] = useState("");
  const [ingredients, setIngredients] = useState([{ name: "", qty: "" }]);
  const [ingredientsList, setIngredientsList] = useState<string[]>([]);
  const [prepCost, setPrepCost] = useState("");
  const [margin, setMargin] = useState("");
  const [result, setResult] = useState<any>(null);

  // 🔹 Load ingredients from backend
  useEffect(() => {
    fetch(`${API}/commodities/`)
      .then((res) => res.json())
      .then((data) => setIngredientsList(data.commodities))
      .catch(() => console.log("Failed to load ingredients"));
  }, []);

  const handleAddIngredient = () =>
    setIngredients([...ingredients, { name: "", qty: "" }]);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(`${API}/menu-calc/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dish, ingredients, prepCost, margin }),
    });

    if (!res.ok) return;

    setResult(await res.json());
  };

  return (
    <div className="w-full max-w-xl bg-[color:var(--color-dark-2)] border border-[color:var(--color-dark-3)] rounded-2xl p-8 md:p-10 shadow-lg text-gray-100">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Menu Price Calculator
        </h1>
        <p className="text-gray-400 text-sm">
          Calculate the ideal selling price based on ingredient costs and margins.
        </p>
      </div>

      <form onSubmit={handleCalculate} className="space-y-5">
        {/* Dish Name */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
            Dish Name
          </label>
          <input
            className="w-full bg-[color:var(--color-dark-3)] border border-[color:var(--color-dark-4)] rounded-xl px-4 py-4 text-gray-100"
            placeholder="e.g. Signature Pasta"
            value={dish}
            onChange={(e) => setDish(e.target.value)}
            required
          />
        </div>

        {/* Ingredients */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
            Ingredients & Quantities
          </label>

          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex gap-3">
              {/* Ingredient dropdown */}
              <select
                className="flex-2 bg-[color:var(--color-dark-3)] border border-[color:var(--color-dark-4)] rounded-xl px-4 py-3 text-gray-100"
                value={ing.name}
                onChange={(e) => {
                  const copy = [...ingredients];
                  copy[idx].name = e.target.value;
                  setIngredients(copy);
                }}
                required
              >
                <option value="">Select Ingredient</option>
                {ingredientsList.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>

              {/* Quantity */}
              <input
                className="flex-1 bg-[color:var(--color-dark-3)] border border-[color:var(--color-dark-4)] rounded-xl px-4 py-3 text-gray-100"
                type="number"
                placeholder="Qty"
                value={ing.qty}
                onChange={(e) => {
                  const copy = [...ingredients];
                  copy[idx].qty = e.target.value;
                  setIngredients(copy);
                }}
                required
              />
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddIngredient}
            className="text-[11px] font-bold text-orange-400 hover:text-white transition-colors ml-1"
          >
            + Add Ingredient
          </button>
        </div>

        {/* Financial Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
              Prep Cost
            </label>
            <input
              className="w-full bg-[color:var(--color-dark-3)] border border-[color:var(--color-dark-4)] rounded-xl px-4 py-4 text-gray-100"
              type="number"
              placeholder="0.00"
              value={prepCost}
              onChange={(e) => setPrepCost(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
              Margin (%)
            </label>
            <input
              className="w-full bg-[color:var(--color-dark-3)] border border-[color:var(--color-dark-4)] rounded-xl px-4 py-4 text-gray-100"
              type="number"
              placeholder="30"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              required
            />
          </div>
        </div>

        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl">
          Calculate Price
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-8 p-6 rounded-2xl bg-[color:var(--color-dark-3)] border border-[color:var(--color-dark-4)] space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Production Cost</span>
            <span className="text-gray-100">Rs. {result.total_cost}</span>
          </div>

          <div className="flex justify-between text-sm border-t border-[color:var(--color-dark-4)] pt-3">
            <span className="text-gray-400">Expected Profit</span>
            <span className="text-green-400">Rs. {result.profit}</span>
          </div>

          <div className="flex justify-between pt-3 border-t border-[color:var(--color-dark-4)]">
            <span className="font-bold text-gray-100">Final Selling Price</span>
            <span className="text-2xl font-black text-orange-400">
              Rs. {result.selling_price}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
