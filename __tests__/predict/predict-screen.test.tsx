import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import PredictScreen from '@/app/(app)/predict';

const mockSession = { token: 'jwt-token' };

jest.mock('@/auth/session', () => ({
  useSession: () => mockSession,
}));

const options = {
  sectors: ['AI', 'Fintech', 'Healthtech'],
  stages: ['Seed', 'Series A', 'Undisclosed'],
  countries: ['Finland', 'Germany', 'United States'],
};

const contractBody = {
  year: 2025,
  founded_year: 2021,
  stage: 'Seed',
  sector: 'Fintech',
  country: 'United States',
  city: 'New York',
  investor_count: 3,
  lead_investor: 'Y Combinator',
  news_mentions: 2,
  news_source: 'TechCrunch',
  company_domain: 'acme.io',
  prev_rounds: 1,
  prev_amount_usd: 1500000,
};

const contractResponse = {
  prediction_id: 12,
  estimated_amount_usd: 4150000,
  estimated_log10: 6.62,
  range_usd: [2100000, 8200000],
  model_version: 3,
  warning: null,
};

type Reply = { status: number; body: unknown };

/** GET /options always succeeds; POST /predict answers with `predict`. */
function mockApi(predict: Reply = { status: 200, body: contractResponse }) {
  const fetchMock = jest.fn(async (url: string, init: RequestInit) => {
    const reply = url.endsWith('/options') && init.method === 'GET' ? { status: 200, body: options } : predict;
    return { ok: reply.status >= 200 && reply.status < 300, status: reply.status, json: async () => reply.body };
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

async function pick(label: string, query: string, value: string) {
  await fireEvent.press(await screen.findByRole('button', { name: label }));
  await fireEvent.changeText(screen.getByLabelText(`Buscar: ${label}`), query);
  await fireEvent.press(screen.getByRole('button', { name: value }));
}

async function fillRequired(stage = 'Seed') {
  await fireEvent.changeText(await screen.findByLabelText('Año de la ronda'), '2025');
  await fireEvent.changeText(screen.getByLabelText('Año de fundación'), '2021');
  await pick('Etapa', stage.slice(0, 3), stage);
  await pick('Sector', 'fin', 'Fintech');
  await pick('País', 'united', 'United States');
}

const submit = () => fireEvent.press(screen.getByRole('button', { name: 'Estimar monto' }));

it('loads the options with the token and filters the picker as the user types', async () => {
  const fetchMock = mockApi();
  await render(<PredictScreen />);

  await fireEvent.press(await screen.findByRole('button', { name: 'Sector' }));
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringMatching(/\/options$/),
    expect.objectContaining({ method: 'GET', headers: { Authorization: 'Bearer jwt-token' } }),
  );
  expect(screen.getByRole('button', { name: 'AI' })).toBeTruthy();

  await fireEvent.changeText(screen.getByLabelText('Buscar: Sector'), 'fin');

  expect(screen.getByRole('button', { name: 'Fintech' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'AI' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Healthtech' })).toBeNull();
});

it('sends the contract example with the Bearer token and shows the result card', async () => {
  const fetchMock = mockApi();
  await render(<PredictScreen />);

  await fillRequired();
  await fireEvent.changeText(screen.getByLabelText('Ciudad'), 'New York');
  await fireEvent.changeText(screen.getByLabelText('Número de inversores'), '3');
  await fireEvent.changeText(screen.getByLabelText('Inversor líder'), 'Y Combinator');
  await fireEvent.changeText(screen.getByLabelText('Menciones en prensa'), '2');
  await fireEvent.changeText(screen.getByLabelText('Fuente de la noticia'), 'TechCrunch');
  await fireEvent.changeText(screen.getByLabelText('Dominio de la empresa'), 'acme.io');
  await fireEvent.changeText(screen.getByLabelText('Rondas anteriores'), '1');
  await fireEvent.changeText(screen.getByLabelText('Monto de la ronda anterior (USD)'), '1500000');
  await submit();

  expect(await screen.findByText('US$ 4.15 M')).toBeTruthy();
  const [url, init] = fetchMock.mock.calls.find(([, call]) => call.method === 'POST')!;
  expect(url).toMatch(/\/predict$/);
  expect(init.headers).toEqual({ Authorization: 'Bearer jwt-token', 'Content-Type': 'application/json' });
  expect(JSON.parse(init.body as string)).toEqual(contractBody);

  expect(screen.getByText('US$ 4,150,000')).toBeTruthy();
  expect(screen.getByText('US$ 2,100,000 – US$ 8,200,000')).toBeTruthy();
  expect(screen.getByText('6.62')).toBeTruthy();
  expect(screen.getByText('Versión 3')).toBeTruthy();
  expect(screen.queryByLabelText('Aviso del modelo')).toBeNull();
});

it('shows the warning the API returns', async () => {
  const warning = 'La etapa "Undisclosed" tiene más error (MdAPE ≈ 71 %).';
  mockApi({ status: 200, body: { ...contractResponse, warning } });
  await render(<PredictScreen />);

  await fillRequired('Undisclosed');
  await submit();

  expect(await screen.findByText(warning)).toBeTruthy();
});

it('does not call the API when a client-side check fails', async () => {
  const fetchMock = mockApi();
  await render(<PredictScreen />);

  await fillRequired();
  await fireEvent.changeText(screen.getByLabelText('Año de fundación'), '2026');
  await submit();

  expect(await screen.findByText('El año de fundación no puede ser posterior al año de la ronda.')).toBeTruthy();
  expect(fetchMock.mock.calls.some(([, init]) => init.method === 'POST')).toBe(false);
});

it('shows the detail of a 422 from the API', async () => {
  mockApi({ status: 422, body: { detail: 'company_age cannot be negative' } });
  await render(<PredictScreen />);

  await fillRequired();
  await submit();

  expect(await screen.findByText('company_age cannot be negative')).toBeTruthy();
});

it('explains a 503 as no active model', async () => {
  mockApi({ status: 503, body: { detail: 'No active model' } });
  await render(<PredictScreen />);

  await fillRequired();
  await submit();

  expect(await screen.findByText('No hay un modelo activo todavía.')).toBeTruthy();
});
