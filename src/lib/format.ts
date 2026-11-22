/** Display helpers shared by every screen (amounts come from the API in plain USD). */

function group(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Full amount, rounded to the dollar: 2957178.72 -> "US$ 2,957,179". */
export function formatUsd(value: number): string {
  return `US$ ${group(value)}`;
}

function trim(value: number, digits: number): string {
  return Number(value.toFixed(digits)).toString();
}

/** Short amount for cards and lists: 2957178.72 -> "US$ 2.96 M". */
export function formatUsdCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `US$ ${trim(value / 1e9, 2)} B`;
  if (abs >= 1e6) return `US$ ${trim(value / 1e6, 2)} M`;
  if (abs >= 1e3) return `US$ ${trim(value / 1e3, 1)} K`;
  return `US$ ${trim(value, 0)}`;
}

/** The API sends mdape and coverage as fractions: 0.529 -> "52.9 %". */
export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)} %`;
}
