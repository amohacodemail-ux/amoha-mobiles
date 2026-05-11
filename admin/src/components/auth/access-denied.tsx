'use client';

import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface AccessDeniedProps {
  module?: string;
  requiredRole?: string;
}

export function AccessDenied({ module, requiredRole }: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-red-50 border border-red-200 rounded-full p-6 mb-6">
        <ShieldAlert className="h-16 w-16 text-red-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Access Denied
      </h1>

      <p className="text-gray-600 text-center max-w-md mb-2">
        You do not have permission to access this area.
      </p>

      {module && (
        <p className="text-sm text-gray-500 mb-6">
          Module: <span className="font-medium">{module}</span>
        </p>
      )}

      {requiredRole && (
        <p className="text-sm text-red-600 mb-6 bg-red-50 px-3 py-1 rounded-full">
          Required role: {requiredRole}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>

        <Button
          onClick={() => router.push('/dashboard')}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Button>
      </div>
    </div>
  );
}
