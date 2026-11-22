import { useEffect, useState } from 'react';

import { ApiError, apiRequest } from '@/api/client';
import type { MetricsResponse } from '@/api/types';
import { useSession } from '@/auth/session';

export interface MetricsState {
  data: MetricsResponse | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/** Loads `GET /metrics` on mount and on demand; keeps the last data while reloading. */
export function useMetrics(): MetricsState {
  const { token } = useSession();
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiRequest<MetricsResponse>('/metrics', { token })
      .then((body) => {
        if (cancelled) return;
        setData(body);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.detail : 'No se pudieron cargar las métricas.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  function reload() {
    setError(null);
    setLoading(true);
    setAttempt((n) => n + 1);
  }

  return { data, error, loading, reload };
}
