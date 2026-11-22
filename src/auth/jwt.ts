export type Role = 'user' | 'admin';

export interface Claims {
  userId: number;
  role: Role;
  /** Expiry in epoch milliseconds. */
  expiresAt: number;
}

function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='));
}

/**
 * Read the claims the backend signs (sub, role, exp). This is for the UI only (which
 * screens to show): the signature is not checked here, the API enforces every permission.
 */
export function decodeClaims(token: string): Claims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
    const userId = Number(payload.sub);
    const { role, exp } = payload;
    if (!Number.isInteger(userId) || (role !== 'user' && role !== 'admin')) return null;
    if (typeof exp !== 'number') return null;
    return { userId, role, expiresAt: exp * 1000 };
  } catch {
    return null;
  }
}
