'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function InventoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Inventory page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <h2 className="text-xl font-semibold text-destructive">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        An error occurred while loading the Inventory page. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
