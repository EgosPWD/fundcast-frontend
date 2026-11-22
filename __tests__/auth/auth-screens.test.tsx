import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { ApiError } from '@/api/client';
import Register from '@/app/register';
import SignIn from '@/app/sign-in';
import type { Session } from '@/auth/session';

const mockSession = {
  signIn: jest.fn<Promise<void>, [string, string]>(),
  signUp: jest.fn<Promise<void>, [string, string]>(),
};

jest.mock('@/auth/session', () => ({
  useSession: () => mockSession as unknown as Session,
}));

beforeEach(() => jest.clearAllMocks());

async function fill(email: string, password: string) {
  await fireEvent.changeText(await screen.findByLabelText('Email'), email);
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), password);
}

it('signs in with the typed credentials (email trimmed)', async () => {
  mockSession.signIn.mockResolvedValue(undefined);
  await renderRouter({ 'sign-in': SignIn, register: Register }, { initialUrl: '/sign-in' });

  await fill('  ana@mail.com ', 'secret123');
  await fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));

  await waitFor(() => expect(mockSession.signIn).toHaveBeenCalledWith('ana@mail.com', 'secret123'));
});

it('shows the API detail when sign-in fails', async () => {
  mockSession.signIn.mockRejectedValue(new ApiError(401, 'Invalid email or password'));
  await renderRouter({ 'sign-in': SignIn, register: Register }, { initialUrl: '/sign-in' });

  await fill('ana@mail.com', 'wrong-pass');
  await fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));

  expect(await screen.findByText('Invalid email or password')).toBeTruthy();
});

it('does not submit with an empty email or password', async () => {
  await renderRouter({ 'sign-in': SignIn, register: Register }, { initialUrl: '/sign-in' });

  await fill('', '');
  await fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));

  expect(await screen.findByText('Escribe tu email y tu contraseña.')).toBeTruthy();
  expect(mockSession.signIn).not.toHaveBeenCalled();
});

it('registers a new account and shows the API detail on a duplicate email', async () => {
  mockSession.signUp.mockRejectedValue(new ApiError(409, 'email is already registered'));
  await renderRouter({ 'sign-in': SignIn, register: Register }, { initialUrl: '/register' });

  await fill('ana@mail.com', 'secret123');
  await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));

  await waitFor(() => expect(mockSession.signUp).toHaveBeenCalledWith('ana@mail.com', 'secret123'));
  expect(await screen.findByText('email is already registered')).toBeTruthy();
});

it('links sign-in and register screens', async () => {
  await renderRouter({ 'sign-in': SignIn, register: Register }, { initialUrl: '/sign-in' });

  await fireEvent.press(await screen.findByText('Crear una cuenta'));

  await waitFor(() => expect(screen).toHavePathname('/register'));
});
