import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

/** One "label: value" line of a result card. */
export function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

export function ErrorText({ message }: { message: string }) {
  return (
    <ThemedText accessibilityRole="alert" style={styles.error}>
      {message}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  error: { color: '#D93025' },
});
