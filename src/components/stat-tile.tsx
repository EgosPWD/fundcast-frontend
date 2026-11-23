import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface StatTileProps {
  label: string;
  value: string;
  /** Plain-language explanation under the value. */
  help?: string;
  /** Acceptance threshold shown next to the value, e.g. "Mínimo 0.55". */
  target?: string;
  /** Pass/fail against the threshold; omit when the stat has none. */
  met?: boolean;
}

/** One metric: label, big tabular value, threshold and a pass/fail indicator. */
export function StatTile({ label, value, help, target, met }: StatTileProps) {
  const theme = useTheme();
  const hasVerdict = met !== undefined;
  const verdictColor = met ? theme.accent : theme.danger;
  return (
    <View style={[styles.tile, { borderColor: theme.border }]}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="mono" style={styles.value}>
        {value}
      </ThemedText>
      {target || hasVerdict ? (
        <View style={styles.verdict}>
          {hasVerdict ? <View style={[styles.dot, { backgroundColor: verdictColor }]} /> : null}
          {hasVerdict ? (
            <ThemedText type="smallBold" style={{ color: verdictColor }}>
              {met ? 'Cumple' : 'No cumple'}
            </ThemedText>
          ) : null}
          {target ? (
            <ThemedText type="mono" themeColor="textSecondary">
              {target}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
      {help ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.help}>
          {help}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: 240,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  value: { fontSize: 30, lineHeight: 38, fontWeight: 700 },
  verdict: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4 },
  help: { fontSize: 13, lineHeight: 18, fontWeight: 400 },
});
