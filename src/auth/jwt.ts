export type Role = 'user' | 'admin';

export interface Claims {
  userId: number;
  role: Role;
  /** Expiry in epoch milliseconds. */
  expiresAt: number;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * base64url → text without relying on a global `atob` (not guaranteed on every Hermes
 * build). The backend's payload is ASCII JSON, so each byte maps to one character.
 */
function decodeBase64Url(segment: string): string {
  let bits = 0;
  let buffer = 0;
  let text = '';
  for (const char of segment.replace(/=+$/, '')) {
    const value = ALPHABET.indexOf(char === '+' ? '-' : char === '/' ? '_' : char);
    if (value < 0) throw new Error('invalid base64url');
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      text += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return text;
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
    const { sub, role, exp } = payload;
    if (typeof sub !== 'string' || !/^\d+$/.test(sub)) return null;
    if (role !== 'user' && role !== 'admin') return null;
    const userId = Number(sub);
    if (typeof exp !== 'number') return null;
    return { userId, role, expiresAt: exp * 1000 };
  } catch {
    return null;
  }
}
