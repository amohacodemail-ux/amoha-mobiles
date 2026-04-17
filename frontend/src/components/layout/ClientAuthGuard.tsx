'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const AuthGuard = dynamic(() => import('./AuthGuard'), {
  ssr: false,
});

export default function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}
