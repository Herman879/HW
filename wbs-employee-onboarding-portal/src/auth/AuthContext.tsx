import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import type { AuthUser } from '../api/types';

type AuthStatus = 'checking' | 'guest' | 'authenticated' | 'unavailable';
interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  refresh: () => Promise<AuthUser | null>;
  signIn: (username: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('checking');
  const refresh = useCallback(async () => {
    setStatus('checking');
    try {
      const result = await api.me();
      if (!result?.user?.id || !Array.isArray(result.user.roles)) throw new Error('Ungültiges Sitzungsprofil.');
      setUser(result.user);
      setStatus('authenticated');
      return result.user;
    } catch (error) {
      setUser(null);
      if (error instanceof ApiError && error.status === 401) {
        setStatus('guest');
        return null;
      }
      setStatus('unavailable');
      throw error;
    }
  }, []);
  useEffect(() => { void refresh().catch(() => undefined); }, [refresh]);

  const signIn = useCallback(async (username: string, password: string) => {
    await api.login({ username, password });
    const verified = await refresh();
    if (!verified) throw new Error('Anmeldung konnte nicht bestätigt werden.');
    return verified;
  }, [refresh]);

  const signOut = useCallback(async () => {
    await api.logout(); // Do not claim success if the server could not terminate the session.
    setUser(null);
    setStatus('guest');
  }, []);
  const value = useMemo(() => ({ user, status, refresh, signIn, signOut }), [user, status, refresh, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth requires AuthProvider');
  return auth;
}
