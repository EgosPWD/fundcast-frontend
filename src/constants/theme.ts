import '@/global.css';

import { Platform } from 'react-native';

/**
 * Design tokens: a warm "ledger paper" palette with ink text, hairline borders and ONE accent
 * (emerald) reserved for primary actions, the predicted amount and the active tab.
 */
export const Colors = {
  light: {
    text: '#151513',
    textSecondary: '#5E5B53',
    background: '#F6F4EF',
    backgroundElement: '#EDEAE2',
    backgroundSelected: '#E3DFD5',
    border: '#DAD6CA',
    accent: '#0F7B5A',
    accentText: '#FFFFFF',
    accentSoft: '#DCEEE6',
    warning: '#7F5200',
    warningSoft: '#F5E9CC',
    danger: '#A52F1C',
    dangerSoft: '#F6DCD5',
  },
  dark: {
    text: '#ECEAE4',
    textSecondary: '#A19E94',
    background: '#121210',
    backgroundElement: '#1B1B18',
    backgroundSelected: '#26261F',
    border: '#2F2E29',
    accent: '#3DD9A4',
    accentText: '#082118',
    accentSoft: '#12302A',
    warning: '#E8B95C',
    warningSoft: '#2B2314',
    danger: '#F2907E',
    dangerSoft: '#321B16',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = { sm: 6, md: 10 } as const;
/** Minimum touch target (px). */
export const TouchTarget = 44;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
