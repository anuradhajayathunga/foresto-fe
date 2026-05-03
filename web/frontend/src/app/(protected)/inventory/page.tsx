"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { FiBox, FiPackage, FiActivity } from 'react-icons/fi'

export default function Inventory() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    authFetch("/api/inventory/items/")
      .then(res => res.json())
      .then(data => {
        if (data) {
          // Check if data is paginated or not
          const items = Array.isArray(data) ? data : (data.results || []);
          setItems(items);
        }
      })
  }, [])

  // Heatmap data derived from items
  const heatmapData = items.map(item => {
    const minLevel = Number(item.reorder_level) || 1; // avoid division by zero
    const ratio = Number(item.current_stock) / minLevel;
    let color = '#f97316'; // Primary Orange

    if (ratio <= 1) color = '#ef4444'; // Red
    else if (ratio <= 1.5) color = '#f59e0b'; // Yellow
    else if (ratio > 4) color = '#3b82f6'; // Blue

    return {
      name: item.name,
      level: Number(item.current_stock),
      color: color
    };
  }).slice(0, 8);

  return (
    <div className="min-h-screen bg-background p-8 text-foreground space-y-10 font-sans">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground text-sm">Monitor stock levels and identify supply risks in real-time</p>
        </div>
        <div className="flex gap-4 mb-1">
            <LegendItem color="bg-primary" label="Healthy" />
            <LegendItem color="bg-amber-500" label="Low" />
            <LegendItem color="bg-red-500" label="Critical" />
            <LegendItem color="bg-blue-500" label="Overstock" />
        </div>
      </header>

      {/* Inventory Heatmap Section */}
      <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-8">
           <FiActivity className="text-primary" />
           <h2 className="text-xl font-bold tracking-tight">Stock Level Distribution</h2>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={heatmapData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500}} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              />
              <Bar dataKey="level" radius={[8, 8, 0, 0]} barSize={50}>
                {heatmapData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory Status Table */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-muted/30">
            <h3 className="font-bold tracking-tight flex items-center gap-2">
                <FiPackage className="text-primary" />
                Live Inventory Status
            </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-widest font-black">
                <tr>
                  <th className="px-8 py-4 font-medium">Ingredient</th>
                  <th className="px-8 py-4 font-medium">Current Stock</th>
                  <th className="px-8 py-4 font-medium">Status</th>
                  <th className="px-8 py-4 font-medium">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, idx) => {
                   const minLevel = Number(item.reorder_level) || 1;
                   const ratio = Number(item.current_stock) / minLevel;
                   let statusText = 'Normal';
                   let statusClass = 'text-primary';
                   if (ratio <= 1) { statusText = 'Critical'; statusClass = 'text-red-500'; }
                   else if (ratio <= 1.5) { statusText = 'Low'; statusClass = 'text-amber-500'; }

                   return (
                    <tr key={idx} className="hover:bg-muted/50 transition group">
                      <td className="px-8 py-5 font-bold text-sm">{item.name}</td>
                      <td className="px-8 py-5 text-sm font-mono font-bold">{item.current_stock}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 border border-current/10 ${statusClass}`}>
                            {statusText}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-muted-foreground text-sm">{item.unit || "units"}</td>
                    </tr>
                   )
                })}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: any) {
    return (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div> 
            {label}
        </div>
    )
}
