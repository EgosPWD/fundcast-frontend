import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'code'
    | 'label'
    | 'mono';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  const fallback: ThemeColor = type === 'link' || type === 'linkPrimary' ? 'accent' : 'text';

  return <Text style={[{ color: theme[themeColor ?? fallback] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: 34,
    fontWeight: 700,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  link: {
    lineHeight: 24,
    fontSize: 14,
    fontWeight: 600,
  },
  linkPrimary: {
    lineHeight: 24,
    fontSize: 14,
    fontWeight: 600,
  },
  /** Small uppercase caption, e.g. "MONTO ESTIMADO". */
  label: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: 600,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  /** Numerals that line up in columns (amounts, metrics, dates). */
  mono: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
    fontVariant: ['tabular-nums'],
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
