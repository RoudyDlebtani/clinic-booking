import { useCallback, useEffect, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Runs an async loader on mount (and whenever `deps` change) and exposes the
 * result with loading/error flags plus a `refetch`. Replaces the server-side
 * data fetching that Next.js server components used to do.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList,
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    run()
      .then((result) => {
        if (active) {
          setData(result);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active)
          setError(err instanceof Error ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [run]);

  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const cancel = load();
    return cancel;
  }, [load, reloadKey]);

  return { data, loading, error, refetch };
}
