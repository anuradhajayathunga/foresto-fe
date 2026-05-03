"use client";

import React, { useState } from 'react';
import { 
  FiUser, 
  FiLock, 
  FiBell, 
  FiSettings, 
  FiGlobe, 
  FiMoon,
  FiMail,
  FiSmartphone,
  FiSave
} from 'react-icons/fi';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-8 space-y-10 font-sans">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">User Profile & Settings</h1>
        <p className="text-slate-400">Manage your account preferences, security settings, and system configurations.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 space-y-2">
          <TabButton id="profile" active={activeTab} set={setActiveTab} icon={<FiUser />} label="Profile Information" />
          <TabButton id="security" active={activeTab} set={setActiveTab} icon={<FiLock />} label="Security & Password" />
          <TabButton id="notifications" active={activeTab} set={setActiveTab} icon={<FiBell />} label="Notification Preferences" />
          <TabButton id="system" active={activeTab} set={setActiveTab} icon={<FiSettings />} label="System Configuration" />
        </aside>

        {/* Content Area */}
        <div className="flex-1 bg-[#1b1f2a] p-10 rounded-3xl border border-[#2a2f3c] shadow-xl">
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold">Profile Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Full Name" placeholder="John Doe" />
                <InputGroup label="Supplier Name" placeholder="Gourmet Supplies Inc." />
                <InputGroup label="Email Address" placeholder="john@gourmet.com" />
                <InputGroup label="Phone Number" placeholder="+1 (555) 000-0000" />
              </div>
              <div className="pt-6 border-t border-[#2a2f3c] flex justify-end">
                <button className="flex items-center gap-2 px-8 py-3 bg-emerald-600 rounded-2xl font-bold hover:bg-emerald-700 transition-all">
                  <FiSave /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold">Password & Security</h2>
              <div className="max-w-md space-y-6">
                <InputGroup label="Current Password" type="password" />
                <InputGroup label="New Password" type="password" />
                <InputGroup label="Confirm New Password" type="password" />
              </div>
              <div className="pt-6 border-t border-[#2a2f3c] flex justify-end">
                <button className="flex items-center gap-2 px-8 py-3 bg-emerald-600 rounded-2xl font-bold hover:bg-emerald-700 transition-all">
                  Update Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold">Notification Preferences</h2>
              <div className="space-y-4">
                <ToggleItem title="Email Alerts" description="Receive stockout and demand spike alerts via email." icon={<FiMail />} active />
                <ToggleItem title="SMS Notifications" description="Critical alerts sent directly to your mobile device." icon={<FiSmartphone />} />
                <ToggleItem title="WhatsApp Integration" description="Forecast summaries and weekly reports via WhatsApp." icon={<FiGlobe />} active />
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold">System Configuration</h2>
              <div className="space-y-4">
                <ToggleItem title="Dark Mode" description="Use the dark system theme for the entire dashboard." icon={<FiMoon />} active />
                <div className="p-6 bg-[#2a2f3c]/30 rounded-2xl border border-[#2a2f3c] space-y-4">
                   <h3 className="text-sm font-bold">Default Forecasting Model</h3>
                   <select className="w-full bg-[#1b1f2a] border border-[#2a2f3c] p-3 rounded-xl text-sm focus:border-emerald-500 outline-none">
                     <option>Ensemble (Recommended)</option>
                     <option>ARIMA</option>
                     <option>Random Forest</option>
                     <option>Holt-Winters</option>
                   </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ id, active, set, icon, label }: any) {
  const isActive = active === id;
  return (
    <button 
      onClick={() => set(id)}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl text-sm font-semibold transition-all ${
        isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-[#1b1f2a] text-slate-400 hover:bg-[#2a2f3c]'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

function InputGroup({ label, placeholder, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      <input 
        type={type} 
        placeholder={placeholder}
        className="w-full bg-[#2a2f3c]/50 border border-[#2a2f3c] p-4 rounded-2xl text-sm focus:border-emerald-500 outline-none transition-all"
      />
    </div>
  );
}

function ToggleItem({ title, description, icon, active = false }: any) {
  return (
    <div className="flex items-center justify-between p-6 bg-[#2a2f3c]/30 rounded-2xl border border-[#2a2f3c]">
      <div className="flex items-center gap-4">
        <div className="bg-[#2a2f3c] p-3 rounded-xl">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${active ? 'bg-emerald-600' : 'bg-[#2a2f3c]'}`}>
        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </div>
    </div>
  );
}
