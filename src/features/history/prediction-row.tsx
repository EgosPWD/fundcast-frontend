import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { PredictionItem, PredictRequest } from '@/api/types';
import { Amount } from '@/components/amount';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatUsd } from '@/lib/format';

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
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <ThemedText type="mono" style={styles.fieldValue}>
        {value}
      </ThemedText>
    </View>
  );
}

/** One ledger line: date and key inputs on the left, amount right-aligned; tap to expand. */
export function PredictionRow({ item, showUser }: { item: PredictionItem; showUser: boolean }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const { input } = item;

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver detalle de la predicción ${item.id}`}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={styles.summary}>
        <View style={styles.summaryText}>
          <ThemedText type="mono" themeColor="textSecondary" style={styles.date}>
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
        </View>
        <Amount value={item.estimated_amount_usd} format="compact" size="large" themeColor="accent" />
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          <ThemedText type="label" themeColor="textSecondary">
            Datos enviados
          </ThemedText>
          {INPUT_FIELDS.map(({ key, label }) => (
            <Field key={key} label={label} value={display(input[key])} />
          ))}
          <ThemedText type="label" themeColor="textSecondary" style={styles.resultLabel}>
            Resultado
          </ThemedText>
          <Field label="Monto estimado" value={formatUsd(item.estimated_amount_usd)} />
          <Field label="log10 del monto" value={item.estimated_log10.toFixed(2)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderBottomWidth: 1 },
  summary: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  summaryText: { flex: 1, gap: Spacing.half },
  date: { fontSize: 12, lineHeight: 16 },
  details: { paddingBottom: Spacing.three, gap: Spacing.one },
  resultLabel: { marginTop: Spacing.two },
  field: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  fieldLabel: { flexShrink: 1 },
  fieldValue: { flexShrink: 1, textAlign: 'right' },
});
