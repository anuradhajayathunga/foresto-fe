"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL + "/api/ingredients";

export default function SupplierDataPage() {
  const [name, setName] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [wastagePercent, setWastagePercent] = useState("");
  const [satisfaction, setSatisfaction] = useState("");   // ✅ new state
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch(`${API}/supplier-data/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        delivery_days: parseInt(deliveryDays),
        wastage_percent: parseFloat(wastagePercent),
        satisfaction: parseInt(satisfaction),   // ✅ send satisfaction
      }),
    });

    if (res.ok) {
      setMessage("✅ Supplier added successfully!");
      setName("");
      setDeliveryDays("");
      setWastagePercent("");
      setSatisfaction("");   // ✅ reset
    } else {
      const txt = await res.text();
      setMessage("❌ Failed: " + txt);
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-xl bg-[color:var(--color-dark-2)] border border-[color:var(--color-dark-3)] rounded-2xl p-10 shadow-lg text-gray-100">
      <h1 className="text-3xl font-bold mb-2">Add Supplier</h1>
      <p className="text-gray-400 text-sm mb-6">
        Register supplier logistics information for recommendation analysis.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter supplier name (e.g. Golden Harvest)"
          required
          className="w-full bg-[color:var(--color-dark-3)] border border-[color:var(--color-dark-4)] rounded-xl px-4 py-4 text-gray-100"
        />

        {/* Delivery Duration */}
        <input
          type="number"
          value={deliveryDays}
          onChange={(e) => setDeliveryDays(e.target.value)}
          placeholder="Enter delivery duration in days (e.g. 2)"
          required
          className="w-full bg-[color:var(--color-dark-3)] border border-[color:var(--color-dark-4)] rounded-xl px-4 py-4 text-gray-100"
        />

        {/* Wastage Percentage */}
        <input
          type="number"
          value={wastagePercent}
          onChange={(e) => setWastagePercent(e.target.value)}
          placeholder="Enter wastage percentage (e.g. 3%)"
          required
          className="w-full bg-[color:var(--color-dark-3)] border border-[color:var(--color-dark-4)] rounded-xl px-4 py-4 text-gray-100"
        />

        {/* Satisfaction Rating */}
        <input
          type="number"
          value={satisfaction}
          onChange={(e) => setSatisfaction(e.target.value)}
          placeholder="Enter satisfaction rating (1–5)"
          required
          min="1"
          max="5"
          className="w-full bg-[color:var(--color-dark-3)] border border-[color:var(--color-dark-4)] rounded-xl px-4 py-4 text-gray-100"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl"
        >
          {loading ? "Submitting..." : "Add Supplier"}
        </button>
      </form>

      {message && (
        <div className="mt-6 p-4 rounded-xl text-sm text-center bg-[color:var(--color-dark-3)] border border-[color:var(--color-dark-4)] text-gray-100">
          {message}
        </div>
      )}
    </div>
  );
}
