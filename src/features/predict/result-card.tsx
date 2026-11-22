import { StyleSheet } from 'react-native';

import type { PredictResponse } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatUsd, formatUsdCompact } from '@/lib/format';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </ThemedView>
  );
}

export function ResultCard({ result }: { result: PredictResponse }) {
  const [low, high] = result.range_usd;
  return (
    <ThemedView type="backgroundElement" style={styles.card} accessibilityLabel="Resultado de la predicción">
      <ThemedText type="small" themeColor="textSecondary">
        Monto estimado
      </ThemedText>
      <ThemedText type="subtitle">{formatUsdCompact(result.estimated_amount_usd)}</ThemedText>
      <ThemedText>{formatUsd(result.estimated_amount_usd)}</ThemedText>
      <Row label="Rango probable" value={`${formatUsd(low)} – ${formatUsd(high)}`} />
      <ThemedText type="small" themeColor="textSecondary">
        El rango es la estimación multiplicada y dividida por 1,5 (el error mediano del modelo ronda el 50 %).
      </ThemedText>
      <Row label="log10 del monto" value={result.estimated_log10.toFixed(2)} />
      <Row label="Modelo" value={`Versión ${result.model_version}`} />
      {result.warning ? (
        <ThemedText accessibilityLabel="Aviso del modelo" accessibilityRole="alert" style={styles.warning}>
          {result.warning}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  warning: { color: '#B06000' },
});
