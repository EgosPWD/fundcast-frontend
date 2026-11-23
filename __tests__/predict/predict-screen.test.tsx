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
  cities_by_country: { Finland: ['Helsinki'], Germany: ['Berlin'], 'United States': ['New York', 'Austin'] },
  lead_investors: ['Sequoia Capital', 'Y Combinator'],
  news_sources: ['techcrunch.com', 'sifted.eu'],
  model_version: 3,
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
  news_source: 'techcrunch.com',
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
  warnings: [],
};

type Reply = { status: number; body: unknown };

/** GET /options always succeeds; POST /predict answers with `predict`. */
function mockApi(predict: Reply = { status: 200, body: contractResponse }, optionsBody: unknown = options) {
  const fetchMock = jest.fn(async (url: string, init: RequestInit) => {
    const reply = url.endsWith('/options') && init.method === 'GET' ? { status: 200, body: optionsBody } : predict;
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
  await pick('Año de la ronda', '2025', '2025');
  await pick('Año de fundación', '2021', '2021');
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
  await pick('Ciudad', 'new', 'New York');
  await fireEvent.changeText(screen.getByLabelText('Número de inversores'), '3');
  await pick('Inversor líder', 'y c', 'Y Combinator');
  await fireEvent.changeText(screen.getByLabelText('Menciones en prensa'), '2');
  await pick('Fuente de la noticia', 'tech', 'techcrunch.com');
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

it('offers founded years only up to the round year and resets an out-of-range one', async () => {
  mockApi();
  await render(<PredictScreen />);

  await pick('Año de la ronda', '2025', '2025');
  await fireEvent.press(screen.getByRole('button', { name: 'Año de fundación' }));
  expect(screen.queryByRole('button', { name: '2026' })).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Buscar: Año de fundación'), '2000');
  expect(screen.getByRole('button', { name: '2000' })).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Buscar: Año de fundación'), '');
  await fireEvent.press(screen.getByRole('button', { name: '2025' }));
  expect(screen.getByRole('button', { name: 'Año de fundación' }).props.accessibilityHint).toBe('Valor actual: 2025');

  await pick('Año de la ronda', '2022', '2022');

  expect(screen.getByRole('button', { name: 'Año de fundación' }).props.accessibilityHint).toBe('Sin elegir');
});

it('offers round years 2019 to 2026 only', async () => {
  mockApi();
  await render(<PredictScreen />);

  await fireEvent.press(await screen.findByRole('button', { name: 'Año de la ronda' }));

  expect(screen.getByRole('button', { name: '2019' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '2026' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: '2018' })).toBeNull();
});

it('does not call the API when a client-side check fails', async () => {
  const fetchMock = mockApi();
  await render(<PredictScreen />);

  await pick('Año de la ronda', '2025', '2025');
  await submit();

  expect(await screen.findByText('Completa el campo obligatorio: Año de fundación.')).toBeTruthy();
  expect(fetchMock.mock.calls.some(([, init]) => init.method === 'POST')).toBe(false);
});

it('disables the city until a country is chosen, lists its cities and clears it when the country changes', async () => {
  mockApi();
  await render(<PredictScreen />);

  const city = await screen.findByRole('button', { name: 'Ciudad' });
  expect(city.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));

  await pick('País', 'united', 'United States');
  await fireEvent.press(screen.getByRole('button', { name: 'Ciudad' }));
  expect(screen.getByRole('button', { name: 'Austin' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Berlin' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Austin' }));
  expect(screen.getByRole('button', { name: 'Ciudad' }).props.accessibilityHint).toBe('Valor actual: Austin');

  await pick('País', 'germ', 'Germany');

  expect(screen.getByRole('button', { name: 'Ciudad' }).props.accessibilityHint).toBe('Sin elegir');
});

it('defaults investors and mentions to 1 and omits the previous amount while prev_rounds is 0', async () => {
  const fetchMock = mockApi();
  await render(<PredictScreen />);
  await fillRequired();

  expect(screen.getByLabelText('Número de inversores').props.value).toBe('1');
  expect(screen.getByLabelText('Menciones en prensa').props.value).toBe('1');
  expect(screen.queryByLabelText('Monto de la ronda anterior (USD)')).toBeNull();

  await fireEvent.changeText(screen.getByLabelText('Rondas anteriores'), '2');
  await fireEvent.changeText(screen.getByLabelText('Monto de la ronda anterior (USD)'), '500000');
  await fireEvent.changeText(screen.getByLabelText('Rondas anteriores'), '0');
  expect(screen.queryByLabelText('Monto de la ronda anterior (USD)')).toBeNull();
  await submit();

  await screen.findByText('US$ 4.15 M');
  const post = fetchMock.mock.calls.find(([, call]) => call.method === 'POST')!;
  const body = JSON.parse(post[1].body as string);
  expect(body).toEqual(expect.objectContaining({ investor_count: 1, news_mentions: 1, prev_rounds: 0 }));
  expect(body).not.toHaveProperty('prev_amount_usd');
});

it('accepts a free-text lead investor and sends null-equivalent (omitted) news source for "Otra"', async () => {
  const fetchMock = mockApi();
  await render(<PredictScreen />);
  await fillRequired();

  await fireEvent.press(screen.getByRole('button', { name: 'Inversor líder' }));
  await fireEvent.changeText(screen.getByLabelText('Buscar: Inversor líder'), 'Nuevo Fondo');
  await fireEvent.press(screen.getByRole('button', { name: 'Usar "Nuevo Fondo"' }));
  await pick('Fuente de la noticia', 'tech', 'techcrunch.com');
  await fireEvent.press(screen.getByRole('button', { name: 'Fuente de la noticia' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Otra / no está en la lista' }));
  await submit();

  await screen.findByText('US$ 4.15 M');
  const post = fetchMock.mock.calls.find(([, call]) => call.method === 'POST')!;
  const body = JSON.parse(post[1].body as string);
  expect(body.lead_investor).toBe('Nuevo Fondo');
  expect(body).not.toHaveProperty('news_source');
});

it('offers the existing investor, not free text, when the typed name differs only in case', async () => {
  mockApi();
  await render(<PredictScreen />);

  await fireEvent.press(await screen.findByRole('button', { name: 'Inversor líder' }));
  await fireEvent.changeText(screen.getByLabelText('Buscar: Inversor líder'), 'y combinator');

  expect(screen.getByRole('button', { name: 'Y Combinator' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Usar "y combinator"' })).toBeNull();
});

it('renders the form with options from a backend without the new lists', async () => {
  const { sectors, stages, countries } = options;
  mockApi(undefined, { sectors, stages, countries });
  await render(<PredictScreen />);
  await fillRequired();

  await fireEvent.press(screen.getByRole('button', { name: 'Inversor líder' }));
  expect(screen.getByLabelText('Buscar: Inversor líder')).toBeTruthy();
});

it('caps the rendered results of a very large list', async () => {
  const many = Array.from({ length: 8000 }, (_, i) => `Fund ${i}`);
  const fetchMock = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ...options, lead_investors: many }),
  }));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  await render(<PredictScreen />);

  await fireEvent.press(await screen.findByRole('button', { name: 'Inversor líder' }));

  expect(screen.getAllByRole('button', { name: /^Fund / }).length).toBeLessThanOrEqual(50);
  expect(screen.getByText(/Mostrando los primeros 50/)).toBeTruthy();
});

it('shows a hint that the company domain history overrides the manual previous round', async () => {
  mockApi();
  await render(<PredictScreen />);

  expect(await screen.findByText(/si el dominio existe en los datos, se usa su historial/i)).toBeTruthy();
});

it('lists every warning the API returns', async () => {
  const warnings = [
    { code: 'unknown_category', field: 'news_source', value: 'x.com' },
    { code: 'unknown_category', field: 'city', value: 'Gotham' },
  ];
  mockApi({ status: 200, body: { ...contractResponse, warnings } });
  await render(<PredictScreen />);

  await fillRequired();
  await submit();

  expect(
    await screen.findByText(
      'Fuente de prensa: "x.com" no aparece en los datos de entrenamiento; el modelo lo trata como valor desconocido.',
    ),
  ).toBeTruthy();
  expect(
    screen.getByText(
      'Ciudad: "Gotham" no aparece en los datos de entrenamiento; el modelo lo trata como valor desconocido.',
    ),
  ).toBeTruthy();
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

it('hides the previous result when the form changes or fails validation', async () => {
  mockApi();
  await render(<PredictScreen />);
  await fillRequired();
  await submit();
  expect(await screen.findByText('US$ 4.15 M')).toBeTruthy();

  await fireEvent.changeText(screen.getByLabelText('Número de inversores'), '5');

  expect(screen.queryByText('US$ 4.15 M')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Número de inversores'), 'x');
  await submit();
  expect(screen.queryByText('US$ 4.15 M')).toBeNull();
});
