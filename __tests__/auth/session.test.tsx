import { act, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { Text } from 'react-native';

import { ApiError, apiRequest } from '@/api/client';
import { SessionProvider, useSession } from '@/auth/session';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
  };
});

function jwt(role: 'user' | 'admin', exp = 2_000_000_000): string {
  const encode = (v: object) => btoa(JSON.stringify(v)).replace(/=+$/, '');
  return `${encode({ alg: 'HS256' })}.${encode({ sub: '3', role, exp })}.sig`;
}

function respond(status: number, body: unknown) {
  return { ok: status < 300, status, json: async () => body };
}

let session: ReturnType<typeof useSession>;
function Probe() {
  session = useSession();
  return <Text>{`${session.status}:${session.role ?? '-'}`}</Text>;
}

async function renderSession() {
  render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
  await waitFor(() => expect(screen.queryByText(/^loading/)).toBeNull());
}

beforeEach(async () => {
  await SecureStore.deleteItemAsync('fundcast.token');
  jest.clearAllMocks();
});

it('starts signed out when nothing is stored', async () => {
  await renderSession();

  expect(screen.getByText('signedOut:-')).toBeTruthy();
});

it('signs in: posts the credentials, keeps the token and exposes the role', async () => {
  const fetchMock = jest.fn(async () => respond(200, { access_token: jwt('admin') }));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  await renderSession();

  await act(() => session.signIn('Admin@Example.com', 'secret123'));

  expect(screen.getByText('signedIn:admin')).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/auth/login', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ email: 'Admin@Example.com', password: 'secret123' }),
  }));
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('fundcast.token', jwt('admin'));
  expect(session.token).toBe(jwt('admin'));
});

it('signs up: registers, then signs in with the same credentials', async () => {
  const calls: string[] = [];
  globalThis.fetch = jest.fn(async (url: string) => {
    calls.push(url);
    return url.endsWith('/auth/register')
      ? respond(201, { id: 3, email: 'ana@mail.com', role: 'user' })
      : respond(200, { access_token: jwt('user') });
  }) as unknown as typeof fetch;
  await renderSession();

  await act(() => session.signUp('ana@mail.com', 'secret123'));

  expect(calls).toEqual(['http://localhost:8000/auth/register', 'http://localhost:8000/auth/login']);
  expect(screen.getByText('signedIn:user')).toBeTruthy();
});

it('keeps the API detail when the login fails and stays signed out', async () => {
  globalThis.fetch = jest.fn(async () => respond(401, { detail: 'Invalid email or password' })) as unknown as typeof fetch;
  await renderSession();

  const error = await session.signIn('a@b.com', 'wrong-pass').catch((e: unknown) => e as ApiError);

  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).detail).toBe('Invalid email or password');
  expect(screen.getByText('signedOut:-')).toBeTruthy();
});

it('restores a stored valid token on start', async () => {
  await SecureStore.setItemAsync('fundcast.token', jwt('user'));

  await renderSession();

  expect(screen.getByText('signedIn:user')).toBeTruthy();
});

it('discards a stored expired token', async () => {
  await SecureStore.setItemAsync('fundcast.token', jwt('user', 1_000));

  await renderSession();

  expect(screen.getByText('signedOut:-')).toBeTruthy();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('fundcast.token');
});

it('signs out and forgets the token', async () => {
  await SecureStore.setItemAsync('fundcast.token', jwt('user'));
  await renderSession();

  await act(() => session.signOut());

  expect(screen.getByText('signedOut:-')).toBeTruthy();
  expect(await SecureStore.getItemAsync('fundcast.token')).toBeNull();
});

it('signs out when an authenticated request gets a 401', async () => {
  await SecureStore.setItemAsync('fundcast.token', jwt('user'));
  await renderSession();
  globalThis.fetch = jest.fn(async () => respond(401, { detail: 'Invalid token' })) as unknown as typeof fetch;

  await act(async () => {
    await apiRequest('/metrics', { token: session.token }).catch(() => undefined);
  });

  await waitFor(() => expect(screen.getByText('signedOut:-')).toBeTruthy());
});
