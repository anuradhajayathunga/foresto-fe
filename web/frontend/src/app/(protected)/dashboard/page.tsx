"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts"
import { 
  FiActivity, 
  FiBox, 
  FiAlertCircle, 
  FiFileText, 
  FiTrendingUp,
  FiArrowUpRight,
  FiArrowDownRight
} from "react-icons/fi"

export default function Dashboard() {

  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    authFetch("/api/dashboard/")
      .then(res => res.json())
      .then(data => {
        if (data) setStats(data)
      })
  }, [])

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  const salesData = stats.sales_items?.map((item: any) => ({
    name: item.ingredient_name,
    quantity: item.quantity
  })) || []

  const inventoryData = stats.inventory_items?.map((item: any) => ({
    name: item.ingredient_name,
    quantity: item.quantity_on_hand
  })) || []

  return (

    <div className="min-h-screen bg-background p-8 space-y-10 font-sans text-foreground">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground text-sm">Real-time insights into your supply chain performance</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold text-muted-foreground shadow-sm">
                SYSTEM LIVE
            </div>
        </div>
      </header>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <Card 
          title="Total Sales" 
          value={stats.total_sales} 
          icon={<FiTrendingUp className="text-primary" />} 
          change="Real-time"
          isUp={true}
        />
        <Card 
          title="Inventory Units" 
          value={stats.total_inventory_units} 
          icon={<FiBox className="text-blue-500" />} 
          change="Synced"
          isUp={true}
        />
        <Card 
          title="Low Stock Items" 
          value={stats.low_stock_items} 
          icon={<FiAlertCircle className="text-red-500" />} 
          change={stats.low_stock_items > 0 ? "Alert" : "Stable"}
          isUp={stats.low_stock_items === 0}
        />
        <Card 
          title="Pending Orders" 
          value={stats.pending_purchase_orders} 
          icon={<FiFileText className="text-amber-500" />} 
          change="Awaiting"
          isUp={true}
        />

      </div>


      {/* Charts Section */}
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8">


        {/* Sales Chart */}
        <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">

          <div className="mb-8">
            <h2 className="text-xl font-bold tracking-tight">Sales Distribution</h2>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest mt-1">Top Ingredients by Quantity</p>
          </div>

          <ResponsiveContainer width="100%" height={300}>

            <BarChart
              data={salesData}
              margin={{ top: 20, right: 20, left: 0, bottom: 80 }}
            >

              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

              <XAxis
                dataKey="name"
                interval={0}
                angle={-30}
                textAnchor="end"
                height={80}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />

              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
              />

              <Bar
                dataKey="quantity"
                fill="var(--primary)"
                radius={[6, 6, 0, 0]}
                barSize={40}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>


        {/* Inventory Chart */}
        <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">

          <div className="mb-8">
            <h2 className="text-xl font-bold tracking-tight">Stock Levels</h2>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest mt-1">Current Quantity on Hand</p>
          </div>

          <ResponsiveContainer width="100%" height={300}>

            <BarChart
              data={inventoryData}
              margin={{ top: 20, right: 20, left: 0, bottom: 80 }}
            >

              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

              <XAxis
                dataKey="name"
                interval={0}
                angle={-30}
                textAnchor="end"
                height={80}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />

              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
              />

              <Bar
                dataKey="quantity"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                barSize={40}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  )
}



function Card({ title, value, icon, change, isUp }: any) {

  return (

    <div className="bg-card border border-border p-6 rounded-3xl shadow-sm hover:translate-y-[-4px] transition-all duration-300">

      <div className="flex items-center justify-between mb-4">
        <div className="bg-muted p-3 rounded-2xl">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
          {isUp ? <FiArrowUpRight /> : <FiArrowDownRight />}
          {change}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
            {title}
        </h3>
        <div className="text-3xl font-bold tracking-tight">
            {value}
        </div>
      </div>

    </div>

  )
}
