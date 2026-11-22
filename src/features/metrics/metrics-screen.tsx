import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { ModelVersionResponse } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
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

const MET_COLOR = '#1E8E3E';
const NOT_MET_COLOR = '#D93025';

function MetricRow({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricHeader}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="smallBold">{value}</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {help}
      </ThemedText>
    </View>
  );
}

function Criterion({ label, met }: { label: string; met: boolean }) {
  return (
    <ThemedText type="smallBold" style={{ color: met ? MET_COLOR : NOT_MET_COLOR }}>
      {`${label}: ${met ? 'cumple' : 'no cumple'}`}
    </ThemedText>
  );
}

function ActiveModelCard({ model }: { model: ModelVersionResponse }) {
  const { metrics } = model;
  const criteria = checkCriteria(metrics);
  return (
    <ThemedView type="backgroundElement" accessibilityLabel="Modelo activo" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        Modelo activo
      </ThemedText>
      <ThemedText type="subtitle">{`Versión ${model.version}`}</ThemedText>

      <MetricRow
        label="R²"
        value={formatMetric(metrics.r2)}
        help="Proporción de la variación del log10 del monto que explica el modelo (1 = perfecto)."
      />
      <MetricRow
        label="MAE_log"
        value={formatMetric(metrics.mae_log)}
        help={`Error absoluto medio en log10: el estimado se desvía en promedio unas ${maeFactor(metrics.mae_log)} veces (10^MAE).`}
      />
      <MetricRow
        label="RMSE_log"
        value={formatMetric(metrics.rmse_log)}
        help="Raíz del error cuadrático medio en log10; castiga más los errores grandes."
      />
      <MetricRow
        label="MdAPE"
        value={formatPercent(metrics.mdape)}
        help="Error mediano en USD: la mitad de las estimaciones se equivoca menos que esto."
      />
      <MetricRow
        label="Cobertura ±50 %"
        value={formatPercent(metrics.coverage)}
        help="Porcentaje de estimaciones dentro de ±50 % del monto real."
      />

      <View style={styles.section}>
        <ThemedText type="smallBold">Criterios de aceptación</ThemedText>
        <Criterion label={`R² ≥ ${ACCEPTANCE.minR2.toFixed(2)}`} met={criteria.r2} />
        <Criterion label={`MAE_log ≤ ${ACCEPTANCE.maxMaeLog.toFixed(2)}`} met={criteria.maeLog} />
      </View>

      <View style={styles.section}>
        <ThemedText type="small">
          {`Entrenamiento: ${formatCount(model.n_train)} filas · Prueba: ${formatCount(model.n_test)} filas`}
        </ThemedText>
        <ThemedText type="small">{`Datos: ${trainingSource(model.training_file_id)}`}</ThemedText>
        <ThemedText type="small">{`Creado: ${formatDateUtc(model.created_at)}`}</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">Hiperparámetros</ThemedText>
        {Object.entries(model.params).map(([key, value]) => (
          <ThemedText key={key} type="code">
            {`${key}: ${formatParam(value)}`}
          </ThemedText>
        ))}
      </View>
    </ThemedView>
  );
}

function VersionRow({ model }: { model: ModelVersionResponse }) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel={`Versión ${model.version} del historial`}
      style={[styles.row, { borderColor: theme.backgroundSelected }]}>
      <View style={styles.rowHeader}>
        <ThemedText type="smallBold">{`v${model.version}`}</ThemedText>
        {model.is_active ? (
          <ThemedText type="smallBold" style={[styles.badge, { backgroundColor: MET_COLOR }]}>
            Activa
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="small">
        {`R² ${formatMetric(model.metrics.r2)} · MAE_log ${formatMetric(model.metrics.mae_log)} · ${formatCount(model.n_train)} filas`}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
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
        <View style={styles.header}>
          <ThemedText type="subtitle">Métricas</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Actualizar"
            accessibilityState={{ disabled: loading }}
            disabled={loading}
            onPress={reload}
            style={[styles.button, { backgroundColor: theme.text, opacity: loading ? 0.6 : 1 }]}>
            <ThemedText type="small" style={{ color: theme.background }}>
              Actualizar
            </ThemedText>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator accessibilityLabel="Cargando métricas" /> : null}
        {error ? (
          <ThemedText accessibilityRole="alert" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        {data ? (
          <>
            {data.active ? (
              <ActiveModelCard model={data.active} />
            ) : (
              <ThemedText>Todavía no hay un modelo activo.</ThemedText>
            )}
            <View style={styles.section}>
              <ThemedText type="smallBold">Historial de versiones</ThemedText>
              {data.versions.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  No hay versiones registradas.
                </ThemedText>
              ) : (
                data.versions.map((model) => <VersionRow key={model.version} model={model} />)
              )}
            </View>
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
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  button: { borderRadius: Spacing.two, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three },
  metric: { gap: Spacing.half },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  section: { gap: Spacing.one },
  row: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.three, gap: Spacing.one },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: {
    color: '#ffffff',
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    overflow: 'hidden',
  },
  error: { color: NOT_MET_COLOR },
});
