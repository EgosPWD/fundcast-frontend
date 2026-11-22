/** Client-side checks for the prediction form; builds the exact `POST /predict` body. */
import type { PredictRequest } from '@/api/types';

/** Raw text of every form field, keyed like the API body. */
export interface PredictFormValues {
  year: string;
  founded_year: string;
  stage: string;
  sector: string;
  country: string;
  city: string;
  investor_count: string;
  lead_investor: string;
  news_mentions: string;
  news_source: string;
  company_domain: string;
  prev_rounds: string;
  prev_amount_usd: string;
}

export type PredictField = keyof PredictFormValues;

export const emptyPredictForm: PredictFormValues = {
  year: '',
  founded_year: '',
  stage: '',
  sector: '',
  country: '',
  city: '',
  investor_count: '',
  lead_investor: '',
  news_mentions: '',
  news_source: '',
  company_domain: '',
  prev_rounds: '',
  prev_amount_usd: '',
};

/** User-visible label of each field (also the input's accessibility label). */
export const fieldLabels: Record<PredictField, string> = {
  year: 'Año de la ronda',
  founded_year: 'Año de fundación',
  stage: 'Etapa',
  sector: 'Sector',
  country: 'País',
  city: 'Ciudad',
  investor_count: 'Número de inversores',
  lead_investor: 'Inversor líder',
  news_mentions: 'Menciones en prensa',
  news_source: 'Fuente de la noticia',
  company_domain: 'Dominio de la empresa',
  prev_rounds: 'Rondas anteriores',
  prev_amount_usd: 'Monto de la ronda anterior (USD)',
};

const REQUIRED = ['year', 'founded_year', 'stage', 'sector', 'country'] as const;
const COUNTS = ['investor_count', 'news_mentions', 'prev_rounds'] as const;
const OPTIONAL_TEXT = ['city', 'lead_investor', 'news_source', 'company_domain'] as const;

export type ValidationResult = { ok: true; body: PredictRequest } | { ok: false; error: string };

class FormError extends Error {}

function parseInteger(field: PredictField, raw: string): number {
  if (!/^-?\d+$/.test(raw)) throw new FormError(`${fieldLabels[field]} debe ser un número entero.`);
  return Number(raw);
}

function build(values: PredictFormValues): PredictRequest {
  const text = (field: PredictField) => values[field].trim();

  for (const field of REQUIRED) {
    if (!text(field)) throw new FormError(`Completa el campo obligatorio: ${fieldLabels[field]}.`);
  }
  const year = parseInteger('year', text('year'));
  const foundedYear = parseInteger('founded_year', text('founded_year'));
  if (foundedYear > year) {
    throw new FormError('El año de fundación no puede ser posterior al año de la ronda.');
  }

  const body: PredictRequest = {
    year,
    founded_year: foundedYear,
    stage: text('stage'),
    sector: text('sector'),
    country: text('country'),
  };
  for (const field of OPTIONAL_TEXT) {
    if (text(field)) body[field] = text(field);
  }
  for (const field of COUNTS) {
    if (!text(field)) continue;
    const count = parseInteger(field, text(field));
    if (count < 0) throw new FormError(`${fieldLabels[field]} no puede ser negativo.`);
    body[field] = count;
  }
  const amount = text('prev_amount_usd');
  if (amount) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      throw new FormError('El monto de la ronda anterior debe ser un número mayor que 0.');
    }
    body.prev_amount_usd = value;
  }
  return body;
}

/** Validates the raw form; empty optional fields are omitted from the body. */
export function validatePredictForm(values: PredictFormValues): ValidationResult {
  try {
    return { ok: true, body: build(values) };
  } catch (e) {
    if (e instanceof FormError) return { ok: false, error: e.message };
    throw e;
  }
}
