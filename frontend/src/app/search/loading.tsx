export default function Loading() {
  return (
    <div className="page-container py-10">
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card overflow-hidden">
            <div className="aspect-square animate-pulse bg-gray-200 dark:bg-white/5" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-white/5" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-white/5" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
