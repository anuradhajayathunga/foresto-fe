"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL + "/api/ingredients";

export default function SupplierRecommendation() {
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const loadSuppliers = async () => {
    const res = await fetch(`${API}/suppliers/recommend/`);
    const data = await res.json();
    setSuppliers(data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[color:var(--color-dark-2)] text-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Supplier Recommendation</h1>

      <button
        onClick={loadSuppliers}
        className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded font-semibold text-white"
      >
        Get Best Suppliers
      </button>

      {suppliers.map((s, i) => (
        <div
          key={i}
          className="border border-[color:var(--color-dark-4)] bg-[color:var(--color-dark-3)] p-4 mt-4 rounded-xl w-96 shadow-md"
        >
          <h2 className="text-xl font-bold mb-2">{s.name}</h2>
          <p className="text-gray-300">Delivery Days: {s.delivery_days}</p>
          <p className="text-gray-300">Wastage: {s.wastage_percent}%</p>
          <p className="text-gray-300">Score: {s.score.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
