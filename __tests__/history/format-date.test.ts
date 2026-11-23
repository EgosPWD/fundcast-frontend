import { formatDateTime } from '@/features/history/format-date';

it('formats a timestamp as local day/month/year and 24h time', () => {
  // Built from local components, so the expectation holds in any time zone.
  const local = new Date(2026, 10, 2, 9, 5);

  expect(formatDateTime(local.toISOString())).toBe('02/11/2026 09:05');
});

it('shows a dash when the timestamp is missing or invalid', () => {
  expect(formatDateTime(null)).toBe('—');
  expect(formatDateTime(undefined)).toBe('—');
  expect(formatDateTime('not a date')).toBe('—');
});
