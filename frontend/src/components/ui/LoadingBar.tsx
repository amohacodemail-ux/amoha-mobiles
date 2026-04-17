'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const LoadingBarComponent = dynamic(
  () => import('./LoadingBarInner'),
  { ssr: false }
);

export function LoadingBar() {
  return (
    <Suspense fallback={null}>
      <LoadingBarComponent />
    </Suspense>
  );
}
