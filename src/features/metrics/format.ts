/** Display helpers for the model metrics screen. */
import type { MetricsSchema } from '@/api/types';

/** Acceptance criteria of the course project (stored by the backend as `criterios`). */
export const ACCEPTANCE = { minR2: 0.55, maxMaeLog: 0.4 } as const;

export interface CriteriaResult {
  r2: boolean;
  maeLog: boolean;
}

export function checkCriteria(metrics: MetricsSchema): CriteriaResult {
  return { r2: metrics.r2 >= ACCEPTANCE.minR2, maeLog: metrics.mae_log <= ACCEPTANCE.maxMaeLog };
}

/** Log-scale metrics and R² with three decimals: 0.61532 -> "0.615". */
export function formatMetric(value: number): string {
  return value.toFixed(3);
}

/** Row counts with thousands separators: 12758 -> "12,758". */
export function formatCount(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** How many times the estimate deviates on average: MAE_log 0.350 -> "2.2". */
export function maeFactor(maeLog: number): string {
  return (10 ** maeLog).toFixed(1);
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** ISO timestamp shown in UTC so every viewer reads the same value: "22/11/2026 19:03 UTC". */
export function formatDateUtc(iso: string | null | undefined): string {
  if (!iso) return 'Sin fecha';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
  return `${day} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

/** Which data the version was trained with: null means the original Kaggle CSV only. */
export function trainingSource(trainingFileId: number | null | undefined): string {
  return trainingFileId == null ? 'CSV original' : `Carga #${trainingFileId}`;
}

export function formatParam(value: unknown): string {
  return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
}
