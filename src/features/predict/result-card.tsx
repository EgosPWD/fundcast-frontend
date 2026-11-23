import { StyleSheet, View } from 'react-native';

import type { CategoryWarning, PredictResponse } from '@/api/types';
import { Amount } from '@/components/amount';
import { Notice } from '@/components/notice';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatUsd } from '@/lib/format';

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderTopColor: theme.border }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="mono">{value}</ThemedText>
    </View>
  );
}

/** The hero of the app: the estimated amount, its range and the model's own caveats. */
export function ResultCard({ result }: { result: PredictResponse }) {
  const theme = useTheme();
  const [low, high] = result.range_usd;
  return (
    <View
      accessibilityLabel="Resultado de la predicción"
      style={[styles.card, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}>
      <ThemedText type="label" themeColor="textSecondary">
        Monto estimado
      </ThemedText>
      <Amount value={result.estimated_amount_usd} format="compact" size="hero" themeColor="accent" />
      <Amount value={result.estimated_amount_usd} themeColor="textSecondary" />

      <View style={styles.details}>
        <Row label="Rango probable" value={`${formatUsd(low)} – ${formatUsd(high)}`} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          El rango es la estimación multiplicada y dividida por 1,5 (el error mediano del modelo ronda el 50 %).
        </ThemedText>
        <Row label="log10 del monto" value={result.estimated_log10.toFixed(2)} />
        <Row label="Modelo" value={`Versión ${result.model_version}`} />
      </View>

      {result.warning ? (
        <Notice tone="warning" accessibilityLabel="Aviso del modelo" message={result.warning} />
      ) : null}
      {result.warnings?.length ? (
        <View accessibilityLabel="Avisos de categorías" style={styles.warnings}>
          {result.warnings.map((warning) => (
            <Notice
              key={`${warning.field}:${warning.value}`}
              tone="warning"
              title="Categoría desconocida"
              message={warningMessage(warning)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const FIELD_LABELS: Record<string, string> = {
  stage: 'Etapa',
  sector: 'Sector',
  country: 'País',
  city: 'Ciudad',
  lead_investor: 'Inversor líder',
  news_source: 'Fuente de prensa',
};

function warningMessage({ field, value }: CategoryWarning): string {
  const label = FIELD_LABELS[field] ?? field;
  return `${label}: "${value}" no aparece en los datos de entrenamiento; el modelo lo trata como valor desconocido.`;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.four, gap: Spacing.two },
  details: { marginTop: Spacing.two, gap: Spacing.two },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: Spacing.two,
    flexWrap: 'wrap',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
  },
  note: { fontSize: 13, lineHeight: 18, fontWeight: 400 },
  warnings: { gap: Spacing.two },
});
