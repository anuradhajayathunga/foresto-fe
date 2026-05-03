import Sidebar from "./components/Sidebar";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen font-sans text-white">
      {/* Toast notification container */}
      <Toaster position="top-right" />

      <Sidebar />

      <main className="flex-1 bg-[#0f1117] p-10">
        {children}
      </main>
    </div>
  );
}
