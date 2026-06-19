import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken } from "@/lib/api";
import type { CurrentUser } from "@/lib/types";

interface AuthState {
  user: CurrentUser | null;
  /** True until the initial session has been resolved. */
  loading: boolean;
  /** Sets the user after a successful login/signup. */
  setUser: (user: CurrentUser | null) => void;
  /** Re-fetches the current user from the API using the stored token. */
  refresh: () => Promise<void>;
  /** Clears the stored token and the in-memory user. */
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Tracks the signed-in user for the whole app by validating the stored JWT
 * against the API. Replaces the Supabase session/onAuthStateChange model.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user } = await api<{ user: CurrentUser }>("/api/auth/me");
      setUser(user);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
