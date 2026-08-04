export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-neutral-50 px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-neutral-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-green-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-700">Loading…</p>
          <p className="mt-1 text-xs text-neutral-400">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
}
