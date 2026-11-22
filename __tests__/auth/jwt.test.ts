import { decodeClaims } from '@/auth/jwt';

function token(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('decodeClaims', () => {
  it('reads the user id, role and expiry the backend puts in the token', () => {
    expect(decodeClaims(token({ sub: '7', role: 'admin', iat: 1, exp: 2_000_000_000 }))).toEqual({
      userId: 7,
      role: 'admin',
      expiresAt: 2_000_000_000_000,
    });
  });

  it('decodes base64url payloads (- and _ characters)', () => {
    const claims = decodeClaims(token({ sub: '1', role: 'user', exp: 2_000_000_000, n: '>>>???' }));

    expect(claims?.role).toBe('user');
  });

  it.each([['not-a-jwt'], ['a.b.c'], [token({ sub: '1', role: 'root', exp: 1 })], [token({ role: 'user' })], [token({ sub: '', role: 'user', exp: 2_000_000_000 })]])(
    'returns null for a malformed token or unknown role: %s',
    (value) => {
      expect(decodeClaims(value)).toBeNull();
    },
  );
});
