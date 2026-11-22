import { ApiError, apiRequest, setUnauthorizedHandler } from '@/api/client';

type FetchArgs = [string, RequestInit];

function mockFetch(status: number, body: unknown, { json = true } = {}) {
  const fetchMock = jest.fn(async (..._args: FetchArgs) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (!json) throw new SyntaxError('not json');
      return body;
    },
  }));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('expected the request to fail');
}

afterEach(() => setUnauthorizedHandler(null));

describe('apiRequest', () => {
  it('sends JSON with the bearer token and returns the parsed body', async () => {
    const fetchMock = mockFetch(200, { estimated_amount_usd: 2_957_178 });

    const body = await apiRequest<{ estimated_amount_usd: number }>('/predict', {
      method: 'POST',
      token: 'abc',
      json: { year: 2025 },
    });

    expect(body).toEqual({ estimated_amount_usd: 2_957_178 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8000/predict');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ year: 2025 }));
    expect(init.headers).toEqual({
      Authorization: 'Bearer abc',
      'Content-Type': 'application/json',
    });
  });

  it('adds query parameters and skips undefined ones', async () => {
    const fetchMock = mockFetch(200, { items: [] });

    await apiRequest('/predictions', { query: { page: 2, size: 20, extra: undefined } });

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8000/predictions?page=2&size=20');
  });

  it('sends FormData without forcing a JSON content type', async () => {
    const fetchMock = mockFetch(201, { id: 1 });
    const form = new FormData();

    await apiRequest('/training-files', { method: 'POST', token: 't', form });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(form);
    expect(init.headers).toEqual({ Authorization: 'Bearer t' });
  });

  it('turns an error response into ApiError with the status and the detail string', async () => {
    mockFetch(422, { detail: 'founded_year: Field required' });

    const error = await rejection(apiRequest('/predict', { method: 'POST', json: {} }));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.detail).toBe('founded_year: Field required');
    expect(error.message).toBe('founded_year: Field required');
  });

  it('uses a generic detail when the error body is not JSON', async () => {
    mockFetch(502, null, { json: false });

    const error = await rejection(apiRequest('/metrics'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.detail).toBe('Error del servidor (HTTP 502)');
  });

  it('reports a network failure as ApiError with status 0', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;

    const error = await rejection(apiRequest('/health'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.detail).toBe('No se pudo conectar con el servidor');
  });

  it('calls the unauthorized handler on a 401 of an authenticated request', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch(401, { detail: 'Invalid token' });

    await expect(apiRequest('/metrics', { token: 'expired' })).rejects.toBeInstanceOf(ApiError);

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledWith('expired');
  });

  it('does not call the unauthorized handler for a failed login (no token sent)', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch(401, { detail: 'Invalid email or password' });

    await expect(
      apiRequest('/auth/login', { method: 'POST', json: { email: 'a', password: 'b' } }),
    ).rejects.toMatchObject({ status: 401, detail: 'Invalid email or password' });

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
