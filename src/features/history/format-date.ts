const pad = (value: number) => value.toString().padStart(2, '0');

/** Local date and 24h time: "2026-11-22T19:10:00Z" -> "22/11/2026 16:10" in UTC-3. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
