import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import AppLayout from '@/app/(app)/_layout';
import AppIndex from '@/app/(app)/index';
import History from '@/app/(app)/history';
import Metrics from '@/app/(app)/metrics';
import Predict from '@/app/(app)/predict';
import Training from '@/app/(app)/training';
import RootLayout from '@/app/_layout';
import Register from '@/app/register';
import SignIn from '@/app/sign-in';
import type { Session } from '@/auth/session';

const mockSession: { current: Session } = { current: makeSession('signedOut') };

jest.mock('@/auth/session', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => mockSession.current,
}));

function makeSession(status: Session['status'], role: 'user' | 'admin' | null = null): Session {
  return {
    status,
    role,
    token: status === 'signedIn' ? 'token' : null,
    isAdmin: role === 'admin',
    signIn: jest.fn(async () => undefined),
    signUp: jest.fn(async () => undefined),
    signOut: jest.fn(async () => undefined),
  };
}

const routes = {
  _layout: RootLayout,
  'sign-in': SignIn,
  register: Register,
  '(app)/_layout': AppLayout,
  '(app)/index': AppIndex,
  '(app)/predict': Predict,
  '(app)/history': History,
  '(app)/metrics': Metrics,
  '(app)/training': Training,
};

it('sends a signed-out visitor to the sign-in screen', async () => {
  mockSession.current = makeSession('signedOut');

  await renderRouter(routes, { initialUrl: '/predict' });

  await waitFor(() => expect(screen).toHavePathname('/sign-in'));
});

it('opens the prediction screen for a signed-in user and hides admin training', async () => {
  mockSession.current = makeSession('signedIn', 'user');

  await renderRouter(routes, { initialUrl: '/' });

  await waitFor(() => expect(screen).toHavePathname('/predict'));
  expect(screen.getByText('Historial')).toBeTruthy();
  expect(screen.getByText('Métricas')).toBeTruthy();
  expect(screen.queryByText('Entrenamiento')).toBeNull();
});

it('does not let a user open the admin training screen by URL', async () => {
  mockSession.current = makeSession('signedIn', 'user');

  await renderRouter(routes, { initialUrl: '/training' });

  await waitFor(() => expect(screen).not.toHavePathname('/training'));
});

it('shows the training tab to an admin', async () => {
  mockSession.current = makeSession('signedIn', 'admin');

  await renderRouter(routes, { initialUrl: '/training' });

  await waitFor(() => expect(screen).toHavePathname('/training'));
  expect(screen.getAllByText('Entrenamiento').length).toBeGreaterThan(0);
});

it('signs out from the app header', async () => {
  mockSession.current = makeSession('signedIn', 'user');
  await renderRouter(routes, { initialUrl: '/predict' });

  await fireEvent.press(await screen.findByLabelText('Cerrar sesión'));

  expect(mockSession.current.signOut).toHaveBeenCalledTimes(1);
});

it('shows the product name in the app header so the page title appears once', async () => {
  mockSession.current = makeSession('signedIn', 'user');

  await renderRouter(routes, { initialUrl: '/metrics' });

  await waitFor(() => expect(screen).toHavePathname('/metrics'));
  expect(screen.getByText('Fundcast')).toBeTruthy();
  expect(screen.getAllByRole('header', { name: 'Métricas' })).toHaveLength(1);
});
