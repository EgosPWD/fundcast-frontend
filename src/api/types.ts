/** Named aliases over the generated OpenAPI schema (regenerate with `npm run gen:api`). */
import type { components } from './schema';

type Schemas = components['schemas'];

export type LoginRequest = Schemas['LoginRequest'];
export type RegisterRequest = Schemas['RegisterRequest'];
export type TokenResponse = Schemas['TokenResponse'];
export type UserResponse = Schemas['UserResponse'];
export type PredictRequest = Schemas['PredictRequest'];
export type PredictResponse = Schemas['PredictResponse'];
export type PredictionItem = Schemas['PredictionItem'];
export type PredictionPage = Schemas['PredictionPage'];
export type MetricsResponse = Schemas['MetricsResponse'];
export type ModelVersionResponse = Schemas['ModelVersionResponse'];
export type MetricsSchema = Schemas['MetricsSchema'];
export type OptionsResponse = Schemas['OptionsResponse'];
export type TrainingFileResponse = Schemas['TrainingFileResponse'];
export type RetrainResponse = Schemas['RetrainResponse'];
export type ErrorResponse = Schemas['ErrorResponse'];
