import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as authApi from '@/api/auth';
import { setUnauthorizedHandler } from '@/api/client';

import { decodeClaims, type Role } from './jwt';
import { tokenStorage } from './token-storage';

type Status = 'loading' | 'signedOut' | 'signedIn';

export interface Session {
  status: Status;
  token: string | null;
  role: Role | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Register (role `user`) and sign in with the same credentials. */
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

function usable(token: string | null): { token: string; role: Role } | null {
  const claims = token ? decodeClaims(token) : null;
  if (!token || !claims || claims.expiresAt <= Date.now()) return null;
  return { token, role: claims.role };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [current, setCurrent] = useState<{ token: string; role: Role } | null>(null);

  const signOut = useCallback(async () => {
    setCurrent(null);
    setStatus('signedOut');
    await tokenStorage.clear();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { access_token } = await authApi.login(email, password);
    const next = usable(access_token);
    if (!next) throw new Error('The server returned an unreadable token');
    await tokenStorage.set(access_token);
    setCurrent(next);
    setStatus('signedIn');
  }, []);

  const signUp = useCallback(
    async (email: string, password: string) => {
      await authApi.register(email, password);
      await signIn(email, password);
    },
    [signIn],
  );

  useEffect(() => {
    let active = true;
    tokenStorage.get().then(async (stored) => {
      const restored = usable(stored);
      if (stored && !restored) await tokenStorage.clear();
      if (!active) return;
      setCurrent(restored);
      setStatus(restored ? 'signedIn' : 'signedOut');
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo<Session>(
    () => ({
      status,
      token: current?.token ?? null,
      role: current?.role ?? null,
      isAdmin: current?.role === 'admin',
      signIn,
      signUp,
      signOut,
    }),
    [status, current, signIn, signUp, signOut],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside <SessionProvider>');
  return session;
}
