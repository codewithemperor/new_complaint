import Link from "next/link";
import { Compass, Home, Search, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
          <Compass className="h-10 w-10 text-teal-600" />
        </div>

        <div className="mb-2 flex items-center justify-center gap-2">
          <FileQuestion className="h-5 w-5 text-neutral-400" />
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Error 404
          </p>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Please check the URL or return to the homepage.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <Link
            href="/track"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <Search className="h-4 w-4" />
            Track a complaint
          </Link>
        </div>

        <div className="mt-10 rounded-xl border border-neutral-200 bg-white p-4 text-left">
          <p className="text-xs font-semibold text-neutral-700">
            Quick links
          </p>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <Link href="/" className="text-teal-600 hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-teal-600 hover:underline">
                Staff Login
              </Link>
            </li>
            <li>
              <Link href="/track" className="text-teal-600 hover:underline">
                Track a Complaint
              </Link>
            </li>
            <li>
              <Link href="/report" className="text-teal-600 hover:underline">
                File a Complaint
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
