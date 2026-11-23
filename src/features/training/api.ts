/** Admin training endpoints: CSV upload (`POST /training-files`) and retrain (`POST /retrain`). */
import type { DocumentPickerAsset } from 'expo-document-picker';

import { apiRequest } from '@/api/client';
import type { RetrainResponse, TrainingFileResponse } from '@/api/types';

/** Same limit the API enforces on an uploaded CSV. */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** Returns a Spanish error message, or null when the picked file can be sent. */
export function validateCsvAsset(asset: Pick<DocumentPickerAsset, 'name' | 'size'>): string | null {
  if (!asset.name.toLowerCase().endsWith('.csv')) return 'El archivo debe tener extensión .csv.';
  if (asset.size !== undefined && asset.size > MAX_UPLOAD_BYTES) {
    return 'El archivo supera el límite de 20 MB.';
  }
  return null;
}

/**
 * Multipart body with the field `file`. On web the picker hands over a real File; on
 * iOS/Android the React Native FormData takes a `{ uri, name, type }` descriptor instead.
 */
export function buildTrainingForm(asset: DocumentPickerAsset): FormData {
  const form = new FormData();
  if (asset.file) {
    form.append('file', asset.file, asset.name);
  } else {
    form.append('file', { uri: asset.uri, name: asset.name, type: 'text/csv' } as unknown as Blob);
  }
  return form;
}

export function uploadTrainingFile(
  asset: DocumentPickerAsset,
  token: string | null,
): Promise<TrainingFileResponse> {
  return apiRequest<TrainingFileResponse>('/training-files', {
    method: 'POST',
    token,
    form: buildTrainingForm(asset),
  });
}

export function retrainModel(token: string | null): Promise<RetrainResponse> {
  return apiRequest<RetrainResponse>('/retrain', { method: 'POST', token });
}
