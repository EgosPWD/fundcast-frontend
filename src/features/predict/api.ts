import { apiRequest } from '@/api/client';
import type { OptionsResponse, PredictRequest, PredictResponse } from '@/api/types';

/** Exact stage, sector and country values the active model knows. */
export function fetchOptions(token: string | null): Promise<OptionsResponse> {
  return apiRequest<OptionsResponse>('/options', { token });
}

export function requestPrediction(token: string | null, body: PredictRequest): Promise<PredictResponse> {
  return apiRequest<PredictResponse>('/predict', { method: 'POST', token, json: body });
}
