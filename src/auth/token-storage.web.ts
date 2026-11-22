// Web: expo-secure-store is not available, so the token lives in localStorage.
// It is readable by scripts on this origin: never render untrusted HTML in the app.
const KEY = 'fundcast.token';

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null; // blocked storage (private mode, disabled cookies)
  }
}

export const tokenStorage = {
  // Callers handle a rejection (e.g. getItem throwing in a sandboxed iframe).
  get: async () => storage()?.getItem(KEY) ?? null,
  set: async (token: string) => storage()?.setItem(KEY, token),
  clear: async () => storage()?.removeItem(KEY),
};
