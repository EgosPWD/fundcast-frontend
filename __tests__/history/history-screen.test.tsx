import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { PredictionItem, PredictionPage } from '@/api/types';
import HistoryScreen from '@/app/(app)/history';
import type { Session } from '@/auth/session';
import { formatDateTime } from '@/features/history/format-date';

const mockSession: { current: Partial<Session> } = { current: {} };

jest.mock('@/auth/session', () => ({
  useSession: () => mockSession.current,
}));

const fetchMock = jest.fn();

function item(overrides: Partial<PredictionItem> = {}): PredictionItem {
  return {
    id: 104,
    user_id: 7,
    model_version_id: 5,
    input: {
      year: 2026,
      founded_year: 2018,
      stage: 'Series B',
      sector: 'Life Sciences',
      country: 'India',
      city: 'Bengaluru',
      investor_count: 5,
      lead_investor: 'Growx Ventures',
      news_mentions: 1,
      news_source: null,
      company_domain: '4basecare.com',
      prev_rounds: null,
      prev_amount_usd: null,
    },
    estimated_amount_usd: 19814810.89,
    estimated_log10: 7.297,
    created_at: '2026-11-22T19:10:00Z',
    ...overrides,
  };
}

function page(items: PredictionItem[], total: number, pageNumber = 1): PredictionPage {
  return { items, total, page: pageNumber, size: 20 };
}

function respond(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function requestedUrl(call: number): URL {
  return new URL(fetchMock.mock.calls[call][0] as string);
}

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  mockSession.current = { token: 'tok-123', isAdmin: false };
});

it('requests page 1 with size 20 and the Bearer token', async () => {
  fetchMock.mockResolvedValue(respond(page([item()], 1)));
  await render(<HistoryScreen />);

  await screen.findByText('Series B · Life Sciences · India');
  const url = requestedUrl(0);
  expect(url.pathname).toBe('/predictions');
  expect(url.searchParams.get('page')).toBe('1');
  expect(url.searchParams.get('size')).toBe('20');
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok-123');
});

it('renders each row with stage, sector, country, date, estimate and model version', async () => {
  fetchMock.mockResolvedValue(respond(page([item()], 1)));
  await render(<HistoryScreen />);

  expect(await screen.findByText('Series B · Life Sciences · India')).toBeTruthy();
  expect(screen.getByText('US$ 19.81 M')).toBeTruthy();
  expect(screen.getByText(formatDateTime('2026-11-22T19:10:00Z'))).toBeTruthy();
  expect(screen.getByText('Modelo v5')).toBeTruthy();
});

it('expands a row to show every sent input value and the full result', async () => {
  fetchMock.mockResolvedValue(respond(page([item()], 1)));
  await render(<HistoryScreen />);

  await fireEvent.press(await screen.findByRole('button', { name: /Ver detalle de la predicción 104/ }));

  expect(screen.getByText('Bengaluru')).toBeTruthy();
  expect(screen.getByText('Growx Ventures')).toBeTruthy();
  expect(screen.getByText('4basecare.com')).toBeTruthy();
  expect(screen.getByText('2018')).toBeTruthy();
  // news_source, prev_rounds and prev_amount_usd are null.
  expect(screen.getAllByText('—')).toHaveLength(3);
  expect(screen.getByText('US$ 19,814,811')).toBeTruthy();
  expect(screen.getByText('7.30')).toBeTruthy();
});

it('moves to page 2 with "Siguiente" and disables it on the last page', async () => {
  fetchMock
    .mockResolvedValueOnce(respond(page([item({ id: 1 })], 25, 1)))
    .mockResolvedValueOnce(respond(page([item({ id: 2 })], 25, 2)));
  await render(<HistoryScreen />);

  expect(await screen.findByText('Página 1 de 2')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Siguiente' }));

  expect(await screen.findByText('Página 2 de 2')).toBeTruthy();
  expect(requestedUrl(1).searchParams.get('page')).toBe('2');
  expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled();
});

it('disables "Anterior" on page 1', async () => {
  fetchMock.mockResolvedValue(respond(page([item()], 25)));
  await render(<HistoryScreen />);

  await screen.findByText('Página 1 de 2');
  expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
});

it('reloads page 1 with "Actualizar"', async () => {
  fetchMock.mockResolvedValue(respond(page([item()], 1)));
  await render(<HistoryScreen />);

  await screen.findByText('Series B · Life Sciences · India');
  await fireEvent.press(screen.getByRole('button', { name: 'Actualizar' }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(requestedUrl(1).searchParams.get('page')).toBe('1');
});

it('shows the empty state when there are no predictions', async () => {
  fetchMock.mockResolvedValue(respond(page([], 0)));
  await render(<HistoryScreen />);

  expect(await screen.findByText('Todavía no hay predicciones.')).toBeTruthy();
});

it('shows the API detail when the request fails', async () => {
  fetchMock.mockResolvedValue(respond({ detail: 'Not authenticated' }, 403));
  await render(<HistoryScreen />);

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Not authenticated');
});

it('shows the user_id of each prediction to an admin', async () => {
  mockSession.current = { token: 'tok-123', isAdmin: true };
  fetchMock.mockResolvedValue(respond(page([item({ user_id: 42 })], 1)));
  await render(<HistoryScreen />);

  expect(await screen.findByText('Usuario 42')).toBeTruthy();
});

it('does not show the user_id to a plain user', async () => {
  fetchMock.mockResolvedValue(respond(page([item({ user_id: 42 })], 1)));
  await render(<HistoryScreen />);

  await screen.findByText('Series B · Life Sciences · India');
  expect(screen.queryByText('Usuario 42')).toBeNull();
});

it('keeps the page label consistent with the rows when a page change fails', async () => {
  fetchMock
    .mockResolvedValueOnce(respond(page([item({ id: 1 })], 25, 1)))
    .mockResolvedValueOnce(respond({ detail: 'Error del servidor' }, 500))
    .mockResolvedValueOnce(respond(page([item({ id: 2 })], 25, 2)));
  await render(<HistoryScreen />);
  expect(await screen.findByText('Página 1 de 2')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Siguiente' }));

  expect(await screen.findByText('Error del servidor')).toBeTruthy();
  expect(screen.getByText('Página 1 de 2')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Siguiente' }));
  expect(await screen.findByText('Página 2 de 2')).toBeTruthy();
  expect(requestedUrl(2).searchParams.get('page')).toBe('2');
});
