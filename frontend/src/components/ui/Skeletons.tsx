export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03]">
      <div className="aspect-square shimmer-bg bg-surface-200" />
      <div className="space-y-3 p-3.5 sm:p-4">
        <div className="h-3 w-14 rounded shimmer-bg bg-surface-200" />
        <div className="h-4 w-full rounded shimmer-bg bg-surface-200" />
        <div className="h-3.5 w-3/4 rounded shimmer-bg bg-surface-200" />
        <div className="flex gap-1.5">
          <div className="h-5 w-10 rounded-md shimmer-bg bg-surface-200" />
          <div className="h-5 w-14 rounded-md shimmer-bg bg-surface-200" />
        </div>
        <div className="border-t border-gray-100 dark:border-white/[0.05] pt-3">
          <div className="h-6 w-24 rounded shimmer-bg bg-surface-200" />
          <div className="mt-1.5 h-3 w-16 rounded shimmer-bg bg-surface-200" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="aspect-[21/9] w-full rounded-2xl shimmer-bg bg-surface-200 sm:aspect-[3/1]" />
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="aspect-square rounded-2xl shimmer-bg bg-surface-200" />
      <div className="space-y-4">
        <div className="h-4 w-24 rounded shimmer-bg bg-surface-200" />
        <div className="h-8 w-3/4 rounded shimmer-bg bg-surface-200" />
        <div className="h-4 w-1/2 rounded shimmer-bg bg-surface-200" />
        <div className="h-10 w-32 rounded shimmer-bg bg-surface-200" />
        <div className="space-y-2 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded shimmer-bg bg-surface-200" />
          ))}
        </div>
        <div className="flex gap-3 pt-4">
          <div className="h-12 flex-1 rounded-xl shimmer-bg bg-surface-200" />
          <div className="h-12 flex-1 rounded-xl shimmer-bg bg-surface-200" />
        </div>
      </div>
    </div>
  );
}

export function CartItemSkeleton() {
  return (
    <div className="glass-card-sm flex gap-4 p-4">
      <div className="h-24 w-24 flex-shrink-0 rounded-lg shimmer-bg bg-surface-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded shimmer-bg bg-surface-200" />
        <div className="h-3 w-1/2 rounded shimmer-bg bg-surface-200" />
        <div className="h-6 w-20 rounded shimmer-bg bg-surface-200" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="glass-card-sm space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded shimmer-bg bg-surface-200" />
        <div className="h-6 w-20 rounded-full shimmer-bg bg-surface-200" />
      </div>
      <div className="flex gap-3">
        <div className="h-16 w-16 rounded-lg shimmer-bg bg-surface-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded shimmer-bg bg-surface-200" />
          <div className="h-3 w-1/2 rounded shimmer-bg bg-surface-200" />
        </div>
      </div>
      <div className="h-3 w-1/3 rounded shimmer-bg bg-surface-200" />
    </div>
  );
}
