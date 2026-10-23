'use client';

import * as React from 'react';
import { useSession } from '@/lib/auth-client';

interface AuthContextValue {
  session: any;
  isPending: boolean;
  error: any;
  refetch: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const sessionResult = useSession();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const value: AuthContextValue = React.useMemo(() => {
    if (!mounted) {
      return {
        session: null,
        isPending: true,
        error: null,
        refetch: () => {},
      };
    }
    return {
      session: sessionResult.data,
      isPending: sessionResult.isPending,
      error: sessionResult.error,
      refetch: sessionResult.refetch,
    };
  }, [mounted, sessionResult]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
