"use client"

import { useState } from "react"
import { 
  MoreHorizontal, 
  Search, 
  Plus, 
  Filter, 
  Edit, 
  Trash2, 
  ChefHat, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  ExternalLink,
  ArrowRight
} from "lucide-react"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  Tooltip as RechartsTooltip,
  Cell
} from "recharts"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

// --- UTILS ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(amount);
}

// --- MOCK DATA ---
const menuItems = [
  {
    id: "MI-001",
    name: "Spicy Chicken Burger",
    sku: "BUR-SC-01",
    category: "Burgers",
    price: 1250.00,
    cost: 450.00,
    status: "Active",
    salesLast30Days: 1240,
    image: "/api/placeholder/40/40",
    description: "Crispy fried chicken patty with our signature spicy mayo and jalapeños.",
    recipe: [
      { name: "Burger Bun", quantity: "1 pc", cost: 50 },
      { name: "Chicken Patty (150g)", quantity: "1 pc", cost: 320 },
      { name: "Spicy Sauce", quantity: "30ml", cost: 45 },
      { name: "Lettuce", quantity: "20g", cost: 35 },
    ],
    salesHistory: [
      { day: "Mon", sales: 45 }, { day: "Tue", sales: 52 },
      { day: "Wed", sales: 38 }, { day: "Thu", sales: 65 },
      { day: "Fri", sales: 90 }, { day: "Sat", sales: 110 },
      { day: "Sun", sales: 95 },
    ]
  },
  {
    id: "MI-002",
    name: "Cheese Kottu (L)",
    sku: "KOT-CH-02",
    category: "Kottu",
    price: 1800.00,
    cost: 700.00,
    status: "Active",
    salesLast30Days: 850,
    image: "/api/placeholder/40/40",
    description: "Creamy cheese kottu with roast chicken and double egg.",
    recipe: [],
    salesHistory: [
        { day: "Mon", sales: 30 }, { day: "Tue", sales: 40 },
        { day: "Wed", sales: 45 }, { day: "Thu", sales: 50 },
        { day: "Fri", sales: 80 }, { day: "Sat", sales: 95 },
        { day: "Sun", sales: 85 },
      ]
  },
  {
    id: "MI-003",
    name: "Avocado Smoothie",
    sku: "BEV-AV-03",
    category: "Beverages",
    price: 650.00,
    cost: 200.00,
    status: "Draft",
    salesLast30Days: 0,
    image: "/api/placeholder/40/40",
    description: "Fresh avocado with honey and milk.",
    recipe: [],
    salesHistory: []
  },
]

export default function MenuItemManager() {
  const [selectedItem, setSelectedItem] = useState(menuItems[0])
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const openDetails = (item: any) => {
    setSelectedItem(item)
    setIsSheetOpen(true)
  }

  // --- CHART TOOLTIP COMPONENT ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg">
          <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-sm font-bold text-slate-900">
            {payload[0].value} Sales
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      
      {/* 1. HEADER SECTION */}
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Menu Catalog</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your 24 active items and recipes.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white">
                <ExternalLink className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>
        </div>

        {/* 2. FILTER BAR */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name, SKU or category..." 
              className="pl-9 bg-white border-slate-200 focus-visible:ring-slate-400" 
            />
          </div>
          <Button variant="outline" className="bg-white text-slate-600 border-slate-200 border-dashed">
            <Filter className="mr-2 h-3.5 w-3.5" /> Filter
          </Button>
        </div>

        {/* 3. DATA TABLE */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="font-medium text-slate-500">Item Details</TableHead>
                <TableHead className="font-medium text-slate-500">Category</TableHead>
                <TableHead className="text-right font-medium text-slate-500">Price</TableHead>
                <TableHead className="text-right font-medium text-slate-500">Cost</TableHead>
                <TableHead className="text-right font-medium text-slate-500">Margin</TableHead>
                <TableHead className="text-center font-medium text-slate-500">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => {
                const margin = ((item.price - item.cost) / item.price * 100);
                const isHighMargin = margin > 60;

                return (
                  <TableRow 
                    key={item.id} 
                    className="group cursor-pointer hover:bg-slate-50/80 transition-colors" 
                    onClick={() => openDetails(item)}
                  >
                    <TableCell className="pl-4">
                      <Avatar className="h-9 w-9 rounded-lg border border-slate-100">
                        <AvatarImage src={item.image} className="object-cover" />
                        <AvatarFallback className="rounded-lg bg-slate-100 text-slate-500 text-xs">
                            <Package className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 text-sm">{item.name}</span>
                        <span className="text-xs text-slate-400 font-mono">{item.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-xs text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-sm tabular-nums text-slate-700">
                        {formatCurrency(item.price)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-slate-500 text-sm tabular-nums">
                      {formatCurrency(item.cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <span className={`text-xs font-semibold tabular-nums ${isHighMargin ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {margin.toFixed(0)}%
                        </span>
                        {/* Visual margin indicator */}
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${isHighMargin ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                style={{ width: `${margin}%` }}
                            />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.status === "Active" ? (
                        <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors border-transparent bg-emerald-50 text-emerald-700">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                            Active
                        </div>
                      ) : (
                        <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors border-slate-200 bg-slate-50 text-slate-500">
                            Draft
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                        {/* Actions only visible on group hover for cleaner look */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuLabel className="text-xs text-slate-400 font-normal">Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetails(item); }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit Item</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 4. DETAILS SHEET (The "Inspector" View) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[600px] w-full p-0 gap-0 overflow-hidden flex flex-col bg-white">
          
          {/* Sheet Header */}
          <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4">
                <div className="h-16 w-16 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {/* Placeholder for image */}
                    <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-slate-300" />
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedItem.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs font-normal text-slate-500 bg-white">{selectedItem.category}</Badge>
                        <span className="text-xs text-slate-400 font-mono">{selectedItem.sku}</span>
                    </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8">Edit</Button>
              </div>
            </div>
            
            {/* KPI Mini-Cards */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="border-slate-200 shadow-none bg-white">
                    <CardContent className="p-3">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Price</div>
                        <div className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(selectedItem.price)}</div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-none bg-white">
                    <CardContent className="p-3">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Cost</div>
                        <div className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(selectedItem.cost)}</div>
                    </CardContent>
                </Card>
                <Card className={`shadow-none border ${((selectedItem.price - selectedItem.cost) / selectedItem.price) > 0.6 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'}`}>
                    <CardContent className="p-3">
                        <div className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${((selectedItem.price - selectedItem.cost) / selectedItem.price) > 0.6 ? 'text-emerald-600' : 'text-amber-600'}`}>Margin</div>
                        <div className={`text-lg font-bold tabular-nums ${((selectedItem.price - selectedItem.cost) / selectedItem.price) > 0.6 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {((selectedItem.price - selectedItem.cost) / selectedItem.price * 100).toFixed(1)}%
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="overview" className="w-full">
                <div className="px-6 border-b sticky top-0 bg-white z-10">
                    <TabsList className="h-12 w-full justify-start gap-6 bg-transparent p-0">
                    <TabsTrigger 
                        value="overview" 
                        className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Overview
                    </TabsTrigger>
                    <TabsTrigger 
                        value="recipe" 
                        className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Recipe ({selectedItem.recipe.length})
                    </TabsTrigger>
                    </TabsList>
                </div>
                
                <div className="p-6">
                    <TabsContent value="overview" className="space-y-6 mt-0">
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-slate-500" /> 
                                Sales Performance (30 Days)
                            </h4>
                            {selectedItem.salesHistory.length > 0 ? (
                                <div className="h-[200px] w-full rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={selectedItem.salesHistory}>
                                        <XAxis 
                                            dataKey="day" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            fontSize={11} 
                                            tick={{fill: '#64748b'}}
                                            dy={10}
                                        />
                                        <RechartsTooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                                        <Bar 
                                            dataKey="sales" 
                                            fill="#0f172a" 
                                            radius={[4, 4, 0, 0]} 
                                            barSize={32}
                                        >
                                            {selectedItem.salesHistory.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 5 ? '#0f172a' : '#cbd5e1'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[150px] w-full rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                                    No sales data available
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-slate-500 block text-xs">Tax Category</span>
                                <span className="font-medium text-slate-700">Standard VAT (18%)</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 block text-xs">Printer Station</span>
                                <span className="font-medium text-slate-700">Hot Kitchen</span>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <span className="text-slate-500 block text-xs">Description</span>
                                <p className="text-slate-700 leading-relaxed">{selectedItem.description}</p>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="recipe" className="mt-0">
                        <div className="rounded-lg border border-slate-200 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="text-xs font-semibold uppercase text-slate-500">Ingredient</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase text-slate-500 text-right">Qty</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase text-slate-500 text-right">Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedItem.recipe.length > 0 ? (
                                        selectedItem.recipe.map((ing, i) => (
                                            <TableRow key={i} className="hover:bg-slate-50/50">
                                                <TableCell className="font-medium text-sm text-slate-700">{ing.name}</TableCell>
                                                <TableCell className="text-right text-sm text-slate-500">{ing.quantity}</TableCell>
                                                <TableCell className="text-right text-sm font-mono text-slate-700">{ing.cost.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-slate-500 text-sm">
                                                No ingredients defined. <br/>
                                                <Button variant="link" className="text-indigo-600 h-auto p-0">Add Recipe</Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {selectedItem.recipe.length > 0 && (
                                <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Total Cost</span>
                                    <span className="text-sm font-bold font-mono text-slate-900">{formatCurrency(selectedItem.cost)}</span>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
          </div>

          <SheetFooter className="p-4 border-t bg-white">
            <SheetClose asChild>
                <Button className="w-full bg-slate-900 hover:bg-slate-800">Done</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}