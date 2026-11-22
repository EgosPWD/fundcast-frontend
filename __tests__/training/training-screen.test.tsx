import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';

import TrainingScreen from '@/app/(app)/training';

const mockSession = { token: 'admin-token', isAdmin: true };

jest.mock('@/auth/session', () => ({
  useSession: () => mockSession,
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

const pickMock = DocumentPicker.getDocumentAsync as jest.MockedFunction<
  typeof DocumentPicker.getDocumentAsync
>;

type FetchArgs = [string, RequestInit];

function reply(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function mockFetch(status: number, body: unknown) {
  const fetchMock = jest.fn(async (..._args: FetchArgs) => reply(status, body));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function pickResult(asset: Partial<DocumentPicker.DocumentPickerAsset>) {
  return {
    canceled: false as const,
    assets: [
      {
        name: 'batch_1.csv',
        uri: 'file:///cache/batch_1.csv',
        size: 1024,
        mimeType: 'text/csv',
        lastModified: 0,
        ...asset,
      },
    ],
  };
}


const uploadButton = () => screen.getByRole('button', { name: 'Seleccionar y subir CSV' });
const retrainButton = () => screen.getByRole('button', { name: 'Reentrenar modelo' });

beforeEach(() => jest.clearAllMocks());

describe('upload training CSV', () => {
  it('sends the picked CSV as multipart field "file" with the token and shows the counts', async () => {
    pickMock.mockResolvedValue(pickResult({}));
    // Jest runs Node's FormData, which stringifies the native `{ uri, name, type }` descriptor,
    // so the appended parts are observed on `append` itself.
    const appendSpy = jest.spyOn(FormData.prototype, 'append');
    const fetchMock = mockFetch(200, {
      id: 3,
      filename: 'batch_1.csv',
      rows: 2023,
      rows_inserted: 2000,
      rows_rejected: 23,
      status: 'loaded',
    });
    await render(<TrainingScreen />);

    await fireEvent.press(uploadButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/training-files$/);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer admin-token');
    expect(init.body).toBeInstanceOf(FormData);
    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(appendSpy.mock.contexts[0]).toBe(init.body);
    expect(appendSpy).toHaveBeenCalledWith('file', {
      uri: 'file:///cache/batch_1.csv',
      name: 'batch_1.csv',
      type: 'text/csv',
    });
    appendSpy.mockRestore();

    expect(await screen.findByText('2023')).toBeTruthy();
    expect(screen.getByText('2000')).toBeTruthy();
    expect(screen.getByText('23')).toBeTruthy();
    expect(screen.getByText(/round_id que ya existe/)).toBeTruthy();
  });

  it('rejects a file without the .csv extension without calling the API', async () => {
    pickMock.mockResolvedValue(pickResult({ name: 'data.xlsx' }));
    const fetchMock = mockFetch(200, {});
    await render(<TrainingScreen />);

    await fireEvent.press(uploadButton());

    expect(await screen.findByText('El archivo debe tener extensión .csv.')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a file over 20 MB without calling the API', async () => {
    pickMock.mockResolvedValue(pickResult({ size: 20 * 1024 * 1024 + 1 }));
    const fetchMock = mockFetch(200, {});
    await render(<TrainingScreen />);

    await fireEvent.press(uploadButton());

    expect(await screen.findByText('El archivo supera el límite de 20 MB.')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the API detail of a 422 upload', async () => {
    pickMock.mockResolvedValue(pickResult({}));
    mockFetch(422, { detail: 'missing required columns: stage, sector' });
    await render(<TrainingScreen />);

    await fireEvent.press(uploadButton());

    expect(await screen.findByText('missing required columns: stage, sector')).toBeTruthy();
  });

  it('does nothing when the picker is canceled', async () => {
    pickMock.mockResolvedValue({ canceled: true, assets: null });
    const fetchMock = mockFetch(200, {});
    await render(<TrainingScreen />);

    await fireEvent.press(uploadButton());

    await waitFor(() => expect(pickMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('retrain', () => {
  const metrics = { mae_log: 0.3644, r2: 0.6005, rmse_log: 0.51, mdape: 0.55, coverage: 0.46 };

  it('shows the new version with the activated badge and the metrics', async () => {
    const fetchMock = mockFetch(200, {
      version: 2,
      activated: true,
      metrics,
      n_train: 11505,
      n_test: 2877,
      message: null,
    });
    await render(<TrainingScreen />);

    await fireEvent.press(retrainButton());

    expect(await screen.findByText('Versión 2')).toBeTruthy();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/retrain$/);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer admin-token');
    expect(screen.getByText('Activada')).toBeTruthy();
    expect(screen.getByText('0.601')).toBeTruthy();
    expect(screen.getByText('0.364')).toBeTruthy();
    expect(screen.getByText('55.0 %')).toBeTruthy();
    expect(screen.getByText('46.0 %')).toBeTruthy();
    expect(screen.getByText('11505 / 2877')).toBeTruthy();
  });

  it('shows the inactive badge and the API message when the version was not activated', async () => {
    const message =
      "The new version was stored inactive: its MAE_log is worse than the active version's MAE_log + 0.01. The API keeps predicting with the active version.";
    mockFetch(200, { version: 2, activated: false, metrics, n_train: 11505, n_test: 2877, message });
    await render(<TrainingScreen />);

    await fireEvent.press(retrainButton());

    expect(await screen.findByText('Inactiva')).toBeTruthy();
    expect(screen.queryByText('Activada')).toBeNull();
    expect(screen.getByText(message)).toBeTruthy();
  });

  it('shows the in-progress message on a 409', async () => {
    mockFetch(409, { detail: 'a retrain is already running' });
    await render(<TrainingScreen />);

    await fireEvent.press(retrainButton());

    expect(
      await screen.findByText('Ya hay un reentrenamiento en curso. Espera a que termine.'),
    ).toBeTruthy();
  });

  it('shows the API detail on a 422', async () => {
    mockFetch(422, { detail: 'not enough rows for a stratified split' });
    await render(<TrainingScreen />);

    await fireEvent.press(retrainButton());

    expect(await screen.findByText('not enough rows for a stratified split')).toBeTruthy();
  });

  it('disables the retrain button while the request is pending', async () => {
    let resolve!: (value: ReturnType<typeof reply>) => void;
    const fetchMock = jest.fn(
      (..._args: FetchArgs) => new Promise<ReturnType<typeof reply>>((r) => (resolve = r)),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await render(<TrainingScreen />);

    await fireEvent.press(retrainButton());

    await waitFor(() => expect(retrainButton()).toBeDisabled());
    await fireEvent.press(retrainButton());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () =>
      resolve(
        reply(200, { version: 3, activated: true, metrics, n_train: 1, n_test: 1, message: null }),
      ),
    );
    expect(await screen.findByText('Versión 3')).toBeTruthy();
    expect(retrainButton()).toBeEnabled();
  });
});
