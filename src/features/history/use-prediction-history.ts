import { useEffect, useState } from 'react';

import { ApiError, apiRequest } from '@/api/client';
import type { PredictionPage } from '@/api/types';
import { useSession } from '@/auth/session';

export const PAGE_SIZE = 20;

interface HistoryState {
  data: PredictionPage | null;
  error: string | null;
  loading: boolean;
}

/** Loads one page of `GET /predictions`; the API already filters by the caller's role. */
export function usePredictionHistory() {
  const { token } = useSession();
  const [page, setPage] = useState(1);
  // Bumped by refresh() so reloading the current page re-runs the effect.
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<HistoryState>({ data: null, error: null, loading: true });

  useEffect(() => {
    let active = true;
    apiRequest<PredictionPage>('/predictions', { token, query: { page, size: PAGE_SIZE } })
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((e: unknown) => {
        if (!active) return;
        const error = e instanceof ApiError ? e.detail : 'Algo salió mal. Inténtalo de nuevo.';
        setState((prev) => ({ ...prev, error, loading: false }));
      });
    return () => {
      active = false;
    };
  }, [token, page, reloadKey]);

  const total = state.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function goTo(next: number) {
    setState((prev) => ({ ...prev, loading: true }));
    setPage(next);
    setReloadKey((key) => key + 1);
  }

  return {
    ...state,
    page,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
    previous: () => goTo(page - 1),
    next: () => goTo(page + 1),
    refresh: () => goTo(1),
  };
}
