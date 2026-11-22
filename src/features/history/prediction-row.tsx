import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import type { PredictionItem, PredictRequest } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatUsd, formatUsdCompact } from '@/lib/format';

import { formatDateTime } from './format-date';

/** Every field of the sent `PredictRequest`, in the form's order. */
const INPUT_FIELDS: { key: keyof PredictRequest; label: string }[] = [
  { key: 'year', label: 'Año' },
  { key: 'founded_year', label: 'Año de fundación' },
  { key: 'stage', label: 'Etapa' },
  { key: 'sector', label: 'Sector' },
  { key: 'country', label: 'País' },
  { key: 'city', label: 'Ciudad' },
  { key: 'investor_count', label: 'Número de inversores' },
  { key: 'lead_investor', label: 'Inversor líder' },
  { key: 'news_mentions', label: 'Menciones en prensa' },
  { key: 'news_source', label: 'Fuente de prensa' },
  { key: 'company_domain', label: 'Dominio de la empresa' },
  { key: 'prev_rounds', label: 'Rondas anteriores' },
  { key: 'prev_amount_usd', label: 'Monto anterior (USD)' },
];

function display(value: PredictRequest[keyof PredictRequest]): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{value}</ThemedText>
    </ThemedView>
  );
}

export function PredictionRow({ item, showUser }: { item: PredictionItem; showUser: boolean }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const { input } = item;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver detalle de la predicción ${item.id}`}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={styles.summary}>
        <ThemedView type="backgroundElement" style={styles.summaryText}>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDateTime(item.created_at)}
          </ThemedText>
          <ThemedText type="smallBold">{`${input.stage} · ${input.sector} · ${input.country}`}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {`Modelo v${item.model_version_id}`}
          </ThemedText>
          {showUser ? (
            <ThemedText type="small" themeColor="textSecondary">
              {`Usuario ${item.user_id}`}
            </ThemedText>
          ) : null}
        </ThemedView>
        <ThemedText type="default">{formatUsdCompact(item.estimated_amount_usd)}</ThemedText>
      </Pressable>

      {expanded ? (
        <ThemedView
          type="backgroundElement"
          style={[styles.details, { borderTopColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">Datos enviados</ThemedText>
          {INPUT_FIELDS.map(({ key, label }) => (
            <Field key={key} label={label} value={display(input[key])} />
          ))}
          <ThemedText type="smallBold">Resultado</ThemedText>
          <Field label="Monto estimado" value={formatUsd(item.estimated_amount_usd)} />
          <Field label="log10 del monto" value={item.estimated_log10.toFixed(2)} />
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.two, padding: Spacing.three, gap: Spacing.two },
  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  summaryText: { flex: 1, gap: Spacing.half },
  details: { borderTopWidth: 1, paddingTop: Spacing.two, gap: Spacing.one },
  field: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
});
