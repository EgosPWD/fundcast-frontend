import { fireEvent, render, screen, within } from '@testing-library/react-native';

import type { MetricsResponse, ModelVersionResponse } from '@/api/types';
import type { Session } from '@/auth/session';
import { MetricsScreen } from '@/features/metrics/metrics-screen';

const mockSession = { token: 'test-token' };

jest.mock('@/auth/session', () => ({
  useSession: () => mockSession as unknown as Session,
}));

const PARAMS = {
  model__max_iter: 400,
  model__learning_rate: 0.03,
  model__max_leaf_nodes: 31,
  model__min_samples_leaf: 40,
};

function version(overrides: Partial<ModelVersionResponse> = {}): ModelVersionResponse {
  return {
    version: 5,
    is_active: true,
    metrics: {
      mae_log: 0.3504000849081716,
      r2: 0.6153281477285513,
      rmse_log: 0.4947583569525877,
      mdape: 0.529405315722175,
      coverage: 0.4727272727272727,
    },
    n_train: 12758,
    n_test: 3190,
    params: PARAMS,
    training_file_id: 4,
    created_at: '2026-11-22T19:03:15.398299Z',
    ...overrides,
  };
}

const ACTIVE = version();
const OLDER = version({
  version: 4,
  is_active: false,
  metrics: { mae_log: 0.41, r2: 0.58, rmse_log: 0.52, mdape: 0.6, coverage: 0.4 },
  n_train: 12000,
  training_file_id: null,
  created_at: '2026-11-20T08:00:00Z',
});

type FetchArgs = [string, RequestInit];

function mockFetch(responses: { status: number; body: unknown }[]) {
  const fetchMock = jest.fn(async (..._args: FetchArgs) => {
    const next = responses.length > 1 ? responses.shift()! : responses[0];
    return {
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      json: async () => next.body,
    };
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function ok(body: MetricsResponse) {
  return { status: 200, body };
}

beforeEach(() => jest.clearAllMocks());

it('requests GET /metrics with the Bearer token', async () => {
  const fetchMock = mockFetch([ok({ active: ACTIVE, versions: [ACTIVE] })]);
  await render(<MetricsScreen />);

  await screen.findByLabelText('Modelo activo');
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toMatch(/\/metrics$/);
  expect(init.method).toBe('GET');
  expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
});

it('shows the active version with formatted metrics, sizes, source and params', async () => {
  mockFetch([ok({ active: ACTIVE, versions: [ACTIVE, OLDER] })]);
  await render(<MetricsScreen />);

  const card = within(await screen.findByLabelText('Modelo activo'));
  expect(card.getByText('Versión 5')).toBeTruthy();
  expect(card.getByText('0.615')).toBeTruthy();
  expect(card.getByText('0.350')).toBeTruthy();
  expect(card.getByText('0.495')).toBeTruthy();
  expect(card.getByText('52.9 %')).toBeTruthy();
  expect(card.getByText('47.3 %')).toBeTruthy();
  expect(card.getByText('Entrenamiento: 12,758 filas · Prueba: 3,190 filas')).toBeTruthy();
  expect(card.getByText('Datos: Carga #4')).toBeTruthy();
  expect(card.getByText('Creado: 22/11/2026 19:03 UTC')).toBeTruthy();
  expect(card.getByText(/unas 2\.2 veces/)).toBeTruthy();
  expect(card.getByText('model__learning_rate: 0.03')).toBeTruthy();
  expect(card.getByText('model__max_iter: 400')).toBeTruthy();
});

it('marks the acceptance criteria as met for the real numbers', async () => {
  mockFetch([ok({ active: ACTIVE, versions: [ACTIVE] })]);
  await render(<MetricsScreen />);

  const card = within(await screen.findByLabelText('Modelo activo'));
  expect(card.getByText('R² ≥ 0.55: cumple')).toBeTruthy();
  expect(card.getByText('MAE_log ≤ 0.40: cumple')).toBeTruthy();
});

it('marks the acceptance criteria as not met when the metrics fall short', async () => {
  const weak = version({ metrics: { ...ACTIVE.metrics, r2: 0.5, mae_log: 0.45 } });
  mockFetch([ok({ active: weak, versions: [weak] })]);
  await render(<MetricsScreen />);

  const card = within(await screen.findByLabelText('Modelo activo'));
  expect(card.getByText('R² ≥ 0.55: no cumple')).toBeTruthy();
  expect(card.getByText('MAE_log ≤ 0.40: no cumple')).toBeTruthy();
});

it('renders every version in the history with the active one marked', async () => {
  mockFetch([ok({ active: ACTIVE, versions: [ACTIVE, OLDER] })]);
  await render(<MetricsScreen />);

  const newest = within(await screen.findByLabelText('Versión 5 del historial'));
  expect(newest.getByText('Activa')).toBeTruthy();
  expect(newest.getByText('R² 0.615 · MAE_log 0.350 · 12,758 filas')).toBeTruthy();

  const older = within(screen.getByLabelText('Versión 4 del historial'));
  expect(older.queryByText('Activa')).toBeNull();
  expect(older.getByText('R² 0.580 · MAE_log 0.410 · 12,000 filas')).toBeTruthy();
  expect(older.getByText('20/11/2026 08:00 UTC')).toBeTruthy();
});

it('shows the original CSV as the data source when training_file_id is null', async () => {
  mockFetch([ok({ active: OLDER, versions: [OLDER] })]);
  await render(<MetricsScreen />);

  const card = within(await screen.findByLabelText('Modelo activo'));
  expect(card.getByText('Datos: CSV original')).toBeTruthy();
});

it('shows a message when there is no active model and still renders the history', async () => {
  mockFetch([ok({ active: null, versions: [OLDER] })]);
  await render(<MetricsScreen />);

  expect(await screen.findByText('Todavía no hay un modelo activo.')).toBeTruthy();
  expect(screen.queryByLabelText('Modelo activo')).toBeNull();
  expect(screen.getByLabelText('Versión 4 del historial')).toBeTruthy();
});

it('shows the API detail when the request fails', async () => {
  mockFetch([{ status: 403, body: { detail: 'Not enough permissions' } }]);
  await render(<MetricsScreen />);

  expect(await screen.findByText('Not enough permissions')).toBeTruthy();
});

it('reloads the metrics when "Actualizar" is pressed', async () => {
  const fetchMock = mockFetch([
    ok({ active: OLDER, versions: [OLDER] }),
    ok({ active: ACTIVE, versions: [ACTIVE, OLDER] }),
  ]);
  await render(<MetricsScreen />);

  await screen.findByText('Versión 4');
  await fireEvent.press(screen.getByRole('button', { name: 'Actualizar' }));

  expect(await screen.findByText('Versión 5')).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
