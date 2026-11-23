import { formatPercent, formatUsd, formatUsdCompact } from '@/lib/format';

describe('formatUsd', () => {
  it.each([
    [2_957_178.72, 'US$ 2,957,179'],
    [1_000, 'US$ 1,000'],
    [0, 'US$ 0'],
  ])('%p -> %s', (value, text) => expect(formatUsd(value)).toBe(text));
});

describe('formatUsdCompact', () => {
  it.each([
    [2_957_178.72, 'US$ 2.96 M'],
    [15_400_000, 'US$ 15.4 M'],
    [1_200_000_000, 'US$ 1.2 B'],
    [850_000, 'US$ 850 K'],
    [999, 'US$ 999'],
  ])('%p -> %s', (value, text) => expect(formatUsdCompact(value)).toBe(text));
});

describe('formatPercent', () => {
  it('turns an API fraction into a percentage with one decimal', () => {
    expect(formatPercent(0.529405)).toBe('52.9 %');
    expect(formatPercent(0.4727)).toBe('47.3 %');
    expect(formatPercent(1)).toBe('100.0 %');
  });
});
