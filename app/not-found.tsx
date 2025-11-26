// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="px-10 py-8 max-w-lg text-center">
        <p className="text-2xl font-semibold text-blue-600 mb-2">404</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          This page could not be found
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          href="/auth/signin" // or "/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          Go back to Sign Up
        </Link>
      </div>
    </main>
  );
}
