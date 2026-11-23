import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import type { ModelVersionResponse } from '@/api/types';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { StatTile } from '@/components/stat-tile';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPercent } from '@/lib/format';

import {
  ACCEPTANCE,
  checkCriteria,
  formatCount,
  formatDateUtc,
  formatMetric,
  formatParam,
  maeFactor,
  trainingSource,
} from './format';
import { useMetrics } from './use-metrics';

// The card rounds metrics to 3 decimals; the criterion shows 4 so a value such as 0.5497
// ("0.550" on the card) visibly explains why it does not meet R² ≥ 0.55.
function Criterion({ label, met, value }: { label: string; met: boolean; value: number }) {
  const theme = useTheme();
  return (
    <ThemedText type="mono" style={{ color: met ? theme.accent : theme.danger }}>
      {`${label}: ${met ? 'cumple' : 'no cumple'} (${value.toFixed(4)})`}
    </ThemedText>
  );
}

function ActiveModelCard({ model }: { model: ModelVersionResponse }) {
  const { metrics } = model;
  const criteria = checkCriteria(metrics);
  return (
    <View accessibilityLabel="Modelo activo" style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText type="label" themeColor="textSecondary">
          Modelo activo
        </ThemedText>
        <ThemedText type="subtitle">{`Versión ${model.version}`}</ThemedText>
      </View>

      <View style={styles.tiles}>
        <StatTile
          label="R²"
          value={formatMetric(metrics.r2)}
          target={`Mínimo ${ACCEPTANCE.minR2.toFixed(2)}`}
          met={criteria.r2}
          help="Proporción de la variación del log10 del monto que explica el modelo (1 = perfecto)."
        />
        <StatTile
          label="MAE_log"
          value={formatMetric(metrics.mae_log)}
          target={`Máximo ${ACCEPTANCE.maxMaeLog.toFixed(2)}`}
          met={criteria.maeLog}
          help={`Error absoluto medio en log10: el estimado se desvía en promedio unas ${maeFactor(metrics.mae_log)} veces (10^MAE).`}
        />
        <StatTile
          label="RMSE_log"
          value={formatMetric(metrics.rmse_log)}
          help="Raíz del error cuadrático medio en log10; castiga más los errores grandes."
        />
        <StatTile
          label="MdAPE"
          value={formatPercent(metrics.mdape)}
          help="Error porcentual mediano (sobre el monto en USD): la mitad de las estimaciones se equivoca menos que este porcentaje."
        />
        <StatTile
          label="Cobertura ±50 %"
          value={formatPercent(metrics.coverage)}
          help="Porcentaje de estimaciones dentro de ±50 % del monto real."
        />
      </View>

      <Section title="Criterios de aceptación">
        <Criterion label={`R² ≥ ${ACCEPTANCE.minR2.toFixed(2)}`} met={criteria.r2} value={metrics.r2} />
        <Criterion
          label={`MAE_log ≤ ${ACCEPTANCE.maxMaeLog.toFixed(2)}`}
          met={criteria.maeLog}
          value={metrics.mae_log}
        />
      </Section>

      <Section title="Datos del entrenamiento">
        <ThemedText type="small">
          {`Entrenamiento: ${formatCount(model.n_train)} filas · Prueba: ${formatCount(model.n_test)} filas`}
        </ThemedText>
        <ThemedText type="small">{`Datos: ${trainingSource(model.training_file_id)}`}</ThemedText>
        <ThemedText type="small">{`Creado: ${formatDateUtc(model.created_at)}`}</ThemedText>
      </Section>

      <Section title="Hiperparámetros">
        {Object.entries(model.params).map(([key, value]) => (
          <ThemedText key={key} type="code">
            {`${key}: ${formatParam(value)}`}
          </ThemedText>
        ))}
      </Section>
    </View>
  );
}

function VersionRow({ model }: { model: ModelVersionResponse }) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel={`Versión ${model.version} del historial`}
      style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={styles.rowHeader}>
        <ThemedText type="mono" style={styles.versionTag}>{`v${model.version}`}</ThemedText>
        {model.is_active ? (
          <ThemedText type="label" style={[styles.badge, { backgroundColor: theme.accent, color: theme.accentText }]}>
            Activa
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="mono">
        {`R² ${formatMetric(model.metrics.r2)} · MAE_log ${formatMetric(model.metrics.mae_log)} · ${formatCount(model.n_train)} filas`}
      </ThemedText>
      <ThemedText type="mono" themeColor="textSecondary" style={styles.date}>
        {formatDateUtc(model.created_at)}
      </ThemedText>
    </View>
  );
}

export function MetricsScreen() {
  const theme = useTheme();
  const { data, error, loading, reload } = useMetrics();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Métricas"
          subtitle="Qué tan fiable es el modelo que genera las estimaciones."
          action={<Button label="Actualizar" variant="secondary" disabled={loading} onPress={reload} />}
        />

        {loading ? <ActivityIndicator accessibilityLabel="Cargando métricas" color={theme.accent} /> : null}
        {error ? <Notice tone="error" message={error} /> : null}

        {data ? (
          <>
            {data.active ? (
              <ActiveModelCard model={data.active} />
            ) : (
              <ThemedText>Todavía no hay un modelo activo.</ThemedText>
            )}
            <Section title="Historial de versiones">
              {data.versions.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  No hay versiones registradas.
                </ThemedText>
              ) : (
                data.versions.map((model) => <VersionRow key={model.version} model={model} />)
              )}
            </Section>
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  card: { gap: Spacing.four },
  cardHeader: { gap: Spacing.one },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  row: { borderBottomWidth: 1, paddingVertical: Spacing.three, gap: Spacing.half },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  versionTag: { fontWeight: 700 },
  date: { fontSize: 12, lineHeight: 16 },
  badge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    overflow: 'hidden',
  },
});
