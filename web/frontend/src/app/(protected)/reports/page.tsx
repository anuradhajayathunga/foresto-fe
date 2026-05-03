"use client";

import React from 'react';
import { 
  FiFileText, 
  FiDownload, 
  FiPieChart, 
  FiBarChart2, 
  FiCalendar,
  FiFile,
  FiExternalLink
} from 'react-icons/fi';

export default function Reports() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-8 space-y-10 font-sans">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytical Export</h1>
          <p className="text-slate-400">Generate and export detailed inventory and demand forecasting reports.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-[#1b1f2a] rounded-xl text-sm font-semibold border border-[#2a2f3c] hover:bg-[#2a2f3c] transition-all flex items-center gap-2">
            <FiCalendar /> Schedule Report
          </button>
        </div>
      </header>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard 
          title="Demand Forecast Summary" 
          description="A comprehensive look at predicted demand trends for the next 30 days across all ingredient categories."
          icon={<FiBarChart2 className="text-emerald-500" />}
          type="Periodic"
        />
        <ReportCard 
          title="Inventory Health Audit" 
          description="Detailed breakdown of stock levels, turnover rates, and identified waste patterns for the current quarter."
          icon={<FiPieChart className="text-blue-500" />}
          type="Weekly"
        />
        <ReportCard 
          title="Supplier Procurement Report" 
          description="Reorder history, order fulfillment accuracy, and lead-time analysis for all primary suppliers."
          icon={<FiFileText className="text-amber-500" />}
          type="Monthly"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Exports Table */}
        <div className="xl:col-span-2 bg-[#1b1f2a] p-8 rounded-3xl border border-[#2a2f3c] shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Recent Generated Reports</h2>
            <button className="text-blue-400 text-sm hover:underline">View All</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#2a2f3c] text-slate-500 text-sm">
                  <th className="pb-4 font-medium">Report Name</th>
                  <th className="pb-4 font-medium">Date</th>
                  <th className="pb-4 font-medium">Format</th>
                  <th className="pb-4 font-medium">Size</th>
                  <th className="pb-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2f3c]">
                <ReportRow name="Q1_Inventory_Final.pdf" date="Oct 24, 2026" format="PDF" size="2.4 MB" />
                <ReportRow name="Demand_Forecast_Oct_Week4.csv" date="Oct 22, 2026" format="CSV" size="840 KB" />
                <ReportRow name="Waste_Analysis_Monthly.xlsx" date="Oct 15, 2026" format="Excel" size="1.2 MB" />
                <ReportRow name="Supplier_Performance_Metrics.pdf" date="Oct 10, 2026" format="PDF" size="3.1 MB" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Export Panel */}
        <div className="bg-[#1b1f2a] p-8 rounded-3xl border border-[#2a2f3c] shadow-xl space-y-6">
          <h2 className="text-xl font-bold">Quick Export</h2>
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Select format to export current live dashboard data:</p>
            <div className="grid grid-cols-1 gap-3">
              <ExportButton label="Download as Excel" format="XLSX" />
              <ExportButton label="Download as CSV" format="CSV" />
              <ExportButton label="Generate PDF Report" format="PDF" />
            </div>
          </div>
          
          <div className="pt-6 border-t border-[#2a2f3c] space-y-4">
            <h3 className="text-sm font-bold">Automatic Delivery</h3>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-6 bg-[#2a2f3c] rounded-full relative transition-colors group-hover:bg-[#363c4d]">
                <div className="absolute left-1 top-1 w-4 h-4 bg-emerald-500 rounded-full"></div>
              </div>
              <span className="text-sm text-slate-300">Email weekly summaries</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, description, icon, type }: any) {
  return (
    <div className="bg-[#1b1f2a] p-8 rounded-3xl border border-[#2a2f3c] hover:border-emerald-500/30 transition-all group">
      <div className="bg-[#2a2f3c] w-fit p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">{type}</span>
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
        <button className="pt-4 flex items-center gap-2 text-emerald-500 text-sm font-bold hover:gap-3 transition-all">
          Generate Now <FiExternalLink />
        </button>
      </div>
    </div>
  );
}

function ReportRow({ name, date, format, size }: any) {
  return (
    <tr className="group hover:bg-[#2a2f3c]/30 transition-all">
      <td className="py-4 flex items-center gap-3">
        <FiFile className="text-slate-500" />
        <span className="font-semibold text-sm">{name}</span>
      </td>
      <td className="py-4 text-xs text-slate-500">{date}</td>
      <td className="py-4">
        <span className="text-[10px] font-bold px-2 py-1 bg-[#2a2f3c] rounded text-slate-300">{format}</span>
      </td>
      <td className="py-4 text-xs text-slate-500">{size}</td>
      <td className="py-4 text-right">
        <button className="p-2 hover:bg-emerald-500/20 rounded-xl text-emerald-500 transition-all">
          <FiDownload />
        </button>
      </td>
    </tr>
  );
}

function ExportButton({ label, format }: any) {
  return (
    <button className="w-full flex items-center justify-between p-4 bg-[#2a2f3c]/40 rounded-2xl border border-[#2a2f3c] hover:bg-[#2a2f3c] transition-all group">
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-[10px] font-black text-slate-500 group-hover:text-white transition-colors">{format}</span>
    </button>
  );
}
