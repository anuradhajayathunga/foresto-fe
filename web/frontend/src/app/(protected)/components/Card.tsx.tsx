"use client";

interface CardProps {
  title: string;
  value: number | string;
  color?: string;
}

export default function Card({ title, value, color = "#f59e0b" }: CardProps) {
  return (
    <div className="bg-[#1b1f2a] border border-[#2a2f3c] p-6 rounded-xl shadow">
      <div className="text-gray-400 text-sm mb-2">{title}</div>
      <div className={`text-3xl font-bold`} style={{ color }}>{value}</div>
    </div>
  );
}