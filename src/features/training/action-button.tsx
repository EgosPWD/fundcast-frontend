import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ActionButtonProps {
  label: string;
  busy: boolean;
  onPress: () => void;
}

/** Primary button that shows a spinner and ignores presses while its request runs. */
export function ActionButton({ label, busy, onPress }: ActionButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: busy, busy }}
      disabled={busy}
      onPress={onPress}
      style={[styles.button, { backgroundColor: theme.text, opacity: busy ? 0.6 : 1 }]}>
      {busy ? (
        <ActivityIndicator color={theme.background} />
      ) : (
        <ThemedText style={{ color: theme.background }}>{label}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: Spacing.two, padding: Spacing.three, alignItems: 'center' },
});
