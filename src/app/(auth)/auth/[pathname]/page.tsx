import * as React from 'react';
import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/auth-card';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{
    pathname: string;
  }>;
}

async function AuthContent({ params }: PageProps) {
  const { pathname } = await params;
  return <AuthCard pathname={pathname} />;
}

export default function AuthPage({ params }: PageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <Suspense
        fallback={
          <div className="w-full max-w-md p-6 space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        }
      >
        <AuthContent params={params} />
      </Suspense>
    </div>
  );
}
