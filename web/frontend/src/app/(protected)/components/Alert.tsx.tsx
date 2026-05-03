"use client";

interface AlertProps {
  message: string;
  type?: "error" | "success" | "info";
}

export default function Alert({ message, type = "info" }: AlertProps) {
  const colors = {
    error: "bg-red-500",
    success: "bg-green-500",
    info: "bg-blue-500",
  };
  return (
    <div className={`${colors[type]} text-white px-4 py-2 rounded mb-4`}>
      {message}
    </div>
  );
}