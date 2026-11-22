import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ApiError } from '@/api/client';
import type { TrainingFileResponse } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { ActionButton } from './action-button';
import { uploadTrainingFile, validateCsvAsset } from './api';
import { ErrorText, StatRow } from './stat-row';

const CSV_TYPES = ['text/csv', 'text/comma-separated-values', 'application/csv'];

export function UploadSection({ token }: { token: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrainingFileResponse | null>(null);

  async function pickAndUpload() {
    let picked: DocumentPicker.DocumentPickerResult;
    try {
      picked = await DocumentPicker.getDocumentAsync({ type: CSV_TYPES, base64: false });
    } catch {
      // No document provider, another picker already open, unreadable asset...
      setResult(null);
      setError('No se pudo abrir el selector de archivos. Inténtalo de nuevo.');
      return;
    }
    if (picked.canceled) return;
    const asset = picked.assets[0];
    const invalid = validateCsvAsset(asset);
    if (invalid) {
      setError(invalid);
      setResult(null);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      setResult(await uploadTrainingFile(asset, token));
    } catch (e) {
      setResult(null);
      setError(e instanceof ApiError ? e.detail : 'No se pudo subir el archivo. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Subir archivo de entrenamiento</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Sube un CSV (máximo 20 MB) con las columnas del dataset. Sus filas se agregan a los datos
        de entrenamiento; reentrena el modelo para usarlas.
      </ThemedText>
      <ActionButton
        label="Seleccionar y subir CSV"
        busy={busy}
        onPress={() => void pickAndUpload()}
      />
      {error ? <ErrorText message={error} /> : null}
      {result ? (
        <ThemedView type="backgroundSelected" style={styles.result}>
          <ThemedText type="small">{result.filename}</ThemedText>
          <StatRow label="Filas en el archivo" value={String(result.rows)} />
          <StatRow label="Filas insertadas" value={String(result.rows_inserted)} />
          <StatRow label="Filas rechazadas" value={String(result.rows_rejected)} />
          <ThemedText type="small" themeColor="textSecondary">
            Las filas con un round_id que ya existe se ignoran, así que al volver a subir el mismo
            archivo las insertadas pueden ser 0. Se rechazan las filas sin founded_year, con edad de
            la empresa negativa o con company_domain, stage o amount_status vacíos.
          </ThemedText>
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three },
  result: { borderRadius: Spacing.two, padding: Spacing.three, gap: Spacing.two },
});
