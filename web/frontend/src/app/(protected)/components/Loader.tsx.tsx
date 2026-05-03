"use client";

import { TailSpin } from "react-loader-spinner";

export default function Loader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <TailSpin color="#2563eb" height={50} width={50} />
      <p className="mt-2 text-gray-400">{message}</p>
    </div>
  );
}