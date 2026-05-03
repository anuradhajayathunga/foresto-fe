"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth"

export default function SmartReorder() {
  const [reorders, setReorders] = useState<any[]>([])

  useEffect(() => {
    authFetch(`/api/inventory/items/smart-reorder/`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setReorders(data);
        else if (data && Array.isArray(data.results)) setReorders(data.results);
      })
      .catch(err => console.error(err));
  }, [])

  return (
    <div className="min-h-screen bg-[#0f1117] p-10 text-white">
      <h1 className="text-3xl font-bold mb-8 text-gray-100">Smart Reorder</h1>
      <div className="grid gap-6">
        {reorders.map((item, idx) => (
          <div key={idx} className="bg-[#1b1f2a] p-6 rounded-xl border border-[#2a2f3c] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{item.ingredient_name}</h2>
              <p className="text-sm text-gray-400">Current Stock: {item.current_stock}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-400 font-medium">Suggested: {item.suggested_reorder_qty}</p>
              <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition">
                Create Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
