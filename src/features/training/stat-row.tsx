import { StyleSheet, View } from 'react-native';

import { Notice } from '@/components/notice';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

/** One "label: value" line of a result block. */
export function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="mono">{value}</ThemedText>
    </View>
  );
}

export function ErrorText({ message }: { message: string }) {
  return <Notice tone="error" message={message} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
});
