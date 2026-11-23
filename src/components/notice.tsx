import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface NoticeProps extends ViewProps {
  tone: 'warning' | 'error' | 'success';
  message: string;
  title?: string;
}

/** Inline note: left rule + tinted background in the tone color. Announced as an alert. */
export function Notice({ tone, message, title, style, ...rest }: NoticeProps) {
  const theme = useTheme();
  const color = tone === 'error' ? theme.danger : tone === 'warning' ? theme.warning : theme.accent;
  const soft = tone === 'error' ? theme.dangerSoft : tone === 'warning' ? theme.warningSoft : theme.accentSoft;
  return (
    <View
      accessible
      accessibilityRole={tone === 'success' ? undefined : 'alert'}
      style={[styles.notice, { backgroundColor: soft, borderLeftColor: color }, style]}
      {...rest}>
      {title ? (
        <ThemedText type="label" style={{ color }}>
          {title}
        </ThemedText>
      ) : null}
      <ThemedText type="small" style={{ color }}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderLeftWidth: 3,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.half,
  },
});
