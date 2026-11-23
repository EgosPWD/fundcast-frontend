import type { TextProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ThemeColor } from '@/constants/theme';
import { formatUsd, formatUsdCompact } from '@/lib/format';

interface AmountProps extends TextProps {
  /** Plain USD amount as the API sends it. */
  value: number;
  /** "compact" -> "US$ 2.96 M"; "full" -> "US$ 2,957,179". */
  format?: 'compact' | 'full';
  size?: 'hero' | 'large' | 'body';
  themeColor?: ThemeColor;
}

const SIZES = {
  hero: { fontSize: 44, lineHeight: 52, fontWeight: 700 },
  large: { fontSize: 20, lineHeight: 28, fontWeight: 600 },
  body: { fontSize: 14, lineHeight: 20, fontWeight: 500 },
} as const;

/** Every USD amount in the app goes through here: monospaced tabular numerals. */
export function Amount({ value, format = 'full', size = 'body', themeColor, style, ...rest }: AmountProps) {
  const text = format === 'compact' ? formatUsdCompact(value) : formatUsd(value);
  return (
    <ThemedText type="mono" themeColor={themeColor} style={[SIZES[size], style]} {...rest}>
      {text}
    </ThemedText>
  );
}
