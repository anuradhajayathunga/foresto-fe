"use client";

import React, { useState } from 'react';
import { 
  FiUploadCloud, 
  FiDatabase, 
  FiCheckCircle, 
  FiActivity, 
  FiShield,
  FiLink,
  FiServer
} from 'react-icons/fi';

export default function DataManagement() {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-8 space-y-10 font-sans">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Data Management & Integration</h1>
        <p className="text-slate-400">Collect and manage demand data from restaurant partners with privacy preservation.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#1b1f2a] p-10 rounded-3xl border-2 border-dashed border-[#2a2f3c] flex flex-col items-center justify-center text-center space-y-6 hover:border-emerald-500/50 transition-all group">
            <div className="bg-emerald-500/10 p-6 rounded-full group-hover:scale-110 transition-transform">
              <FiUploadCloud className="text-5xl text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Upload Historical Demand Data</h2>
              <p className="text-slate-400 max-w-sm mx-auto text-sm">Drag and drop your CSV or Excel files here to begin the preprocessing and validation sequence.</p>
            </div>
            <button 
              onClick={() => {
                setIsUploading(true);
                setTimeout(() => setIsUploading(false), 3000);
              }}
              className="px-8 py-3 bg-emerald-600 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20"
            >
              {isUploading ? 'Uploading...' : 'Select Files'}
            </button>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Supported: CSV, XLSX (Max 50MB)</p>
          </div>

          {/* Integration Status */}
          <div className="bg-[#1b1f2a] p-8 rounded-3xl border border-[#2a2f3c] shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FiLink className="text-blue-500" /> Active API Integrations
            </h2>
            <div className="space-y-4">
              <IntegrationItem name="Foresto POS Connect" status="Connected" time="Sync: 5 min ago" />
              <IntegrationItem name="Global Inventory API" status="Connected" time="Sync: 12 min ago" />
              <IntegrationItem name="Third-Party Supplier Hub" status="Disconnected" time="Last sync: 2 days ago" />
            </div>
          </div>
        </div>

        {/* Sidebar: Preprocessing & Security */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-[#1b1f2a] to-[#141822] p-8 rounded-3xl border border-[#2a2f3c] shadow-xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <FiActivity className="text-amber-500" /> Processing Status
            </h2>
            <div className="space-y-6">
              <StatusStep title="Data Cleaning" status="Complete" progress={100} />
              <StatusStep title="Outlier Detection" status="Complete" progress={100} />
              <StatusStep title="Normalization" status="In Progress" progress={65} />
              <StatusStep title="Validation Checks" status="Pending" progress={0} />
            </div>
          </div>

          <div className="bg-emerald-500/5 p-8 rounded-3xl border border-emerald-500/20 space-y-4">
            <div className="bg-emerald-500/20 w-fit p-3 rounded-2xl">
              <FiShield className="text-emerald-500 text-2xl" />
            </div>
            <h2 className="text-lg font-bold text-emerald-500">Federated Learning Hub</h2>
            <p className="text-slate-400 text-sm">
              Your local model is ready to participate in the next global aggregation round. Raw data remains encrypted on your local server.
            </p>
            <div className="pt-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded font-bold uppercase tracking-widest">Secure Node: ACTIVE</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function IntegrationItem({ name, status, time }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#2a2f3c]/30 rounded-2xl border border-[#2a2f3c]">
      <div className="flex items-center gap-4">
        <div className="bg-[#2a2f3c] p-3 rounded-xl">
          <FiServer className="text-slate-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold">{name}</h3>
          <p className="text-[10px] text-slate-500">{time}</p>
        </div>
      </div>
      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${status === 'Connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
        {status.toUpperCase()}
      </span>
    </div>
  );
}

function StatusStep({ title, status, progress }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{title}</span>
        <span className={status === 'Complete' ? 'text-emerald-500' : 'text-amber-500'}>{status}</span>
      </div>
      <div className="h-1.5 w-full bg-[#2a2f3c] rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${status === 'Complete' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
