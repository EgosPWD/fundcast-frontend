import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  busy?: boolean;
  disabled?: boolean;
  /** Stretch to the container width (default for primary). */
  fullWidth?: boolean;
}

/** The single button of the app: emerald primary, outlined secondary. Ignores presses while busy. */
export function Button({ label, onPress, variant = 'primary', busy = false, disabled = false, fullWidth }: ButtonProps) {
  const theme = useTheme();
  const inactive = busy || disabled;
  const primary = variant === 'primary';
  const stretch = fullWidth ?? primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={[
        styles.button,
        stretch && styles.stretch,
        primary
          ? { backgroundColor: theme.accent }
          : { backgroundColor: 'transparent', borderColor: theme.border, borderWidth: 1 },
        { opacity: disabled && !busy ? 0.4 : busy ? 0.7 : 1 },
      ]}>
      {busy ? (
        <ActivityIndicator color={primary ? theme.accentText : theme.text} />
      ) : (
        <ThemedText type="smallBold" style={{ color: primary ? theme.accentText : theme.text }}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: TouchTarget + 4,
    minWidth: TouchTarget,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stretch: { alignSelf: 'stretch' },
});
