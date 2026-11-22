import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import type { RetrainResponse } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatPercent } from '@/lib/format';

import { ActionButton } from './action-button';
import { retrainModel } from './api';
import { ErrorText, StatRow } from './stat-row';

function retrainErrorMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return 'No se pudo reentrenar el modelo. Inténtalo de nuevo.';
  if (e.status === 409) return 'Ya hay un reentrenamiento en curso. Espera a que termine.';
  return e.detail;
}

function ActivationBadge({ activated }: { activated: boolean }) {
  return (
    <View
      accessibilityLabel={activated ? 'Versión activada' : 'Versión inactiva'}
      style={[styles.badge, { backgroundColor: activated ? '#1E8E3E' : '#B06000' }]}>
      <ThemedText type="smallBold" style={styles.badgeText}>
        {activated ? 'Activada' : 'Inactiva'}
      </ThemedText>
    </View>
  );
}

export function RetrainSection({ token }: { token: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RetrainResponse | null>(null);

  async function retrain() {
    setError(null);
    setBusy(true);
    try {
      setResult(await retrainModel(token));
    } catch (e) {
      setResult(null);
      setError(retrainErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Reentrenar el modelo</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Entrena una versión nueva con todas las rondas cargadas (partición 80/20 nueva). La versión
        nueva se activa solo si MAE_log nuevo ≤ MAE_log activo + 0,01; si no, se guarda inactiva y
        la API sigue usando la versión activa. Puede tardar unos 20 segundos.
      </ThemedText>
      <ActionButton label="Reentrenar modelo" busy={busy} onPress={() => void retrain()} />
      {error ? <ErrorText message={error} /> : null}
      {result ? (
        <ThemedView type="backgroundSelected" style={styles.result}>
          <View style={styles.header}>
            <ThemedText type="smallBold">{`Versión ${result.version}`}</ThemedText>
            <ActivationBadge activated={result.activated} />
          </View>
          <StatRow label="R²" value={result.metrics.r2.toFixed(3)} />
          <StatRow label="MAE_log" value={result.metrics.mae_log.toFixed(3)} />
          <StatRow label="MdAPE" value={formatPercent(result.metrics.mdape)} />
          <StatRow label="Cobertura ±50 %" value={formatPercent(result.metrics.coverage)} />
          <StatRow label="Filas entrenamiento / prueba" value={`${result.n_train} / ${result.n_test}`} />
          {result.message ? (
            <ThemedText type="small" themeColor="textSecondary">
              {result.message}
            </ThemedText>
          ) : null}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three },
  result: { borderRadius: Spacing.two, padding: Spacing.three, gap: Spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.half },
  badgeText: { color: '#ffffff' },
});
