import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, type KeyboardTypeOptions } from 'react-native';

import { ApiError } from '@/api/client';
import type { OptionsResponse, PredictResponse } from '@/api/types';
import { useSession } from '@/auth/session';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { fetchOptions, requestPrediction } from './api';
import { OptionPicker } from './option-picker';
import { ResultCard } from './result-card';
import { emptyPredictForm, fieldLabels, type PredictField, validatePredictForm } from './validation';

type OptionsState =
  | { status: 'loading' }
  | { status: 'ready'; options: OptionsResponse }
  | { status: 'error'; message: string };

function errorMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return 'Algo salió mal. Inténtalo de nuevo.';
  if (e.status === 503) return 'No hay un modelo activo todavía.';
  return e.detail;
}

const OPTIONAL_FIELDS: { field: PredictField; keyboard?: KeyboardTypeOptions }[] = [
  { field: 'city' },
  { field: 'investor_count', keyboard: 'number-pad' },
  { field: 'lead_investor' },
  { field: 'news_mentions', keyboard: 'number-pad' },
  { field: 'news_source' },
  { field: 'company_domain' },
  { field: 'prev_rounds', keyboard: 'number-pad' },
  { field: 'prev_amount_usd', keyboard: 'decimal-pad' },
];

export function PredictionForm() {
  const theme = useTheme();
  const { token } = useSession();
  const [optionsState, setOptionsState] = useState<OptionsState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [values, setValues] = useState(emptyPredictForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOptions(token)
      .then((options) => {
        if (!cancelled) setOptionsState({ status: 'ready', options });
      })
      .catch((e: unknown) => {
        if (!cancelled) setOptionsState({ status: 'error', message: errorMessage(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  function retryOptions() {
    setOptionsState({ status: 'loading' });
    setReloadKey((key) => key + 1);
  }

  function update(field: PredictField, text: string) {
    setValues((current) => ({ ...current, [field]: text }));
  }

  async function submit() {
    const validation = validatePredictForm(values);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      setResult(await requestPrediction(token, validation.body));
    } catch (e) {
      setResult(null);
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const input = [styles.input, { color: theme.text, borderColor: theme.backgroundSelected }];
  function textField(field: PredictField, keyboard?: KeyboardTypeOptions, required = false) {
    return (
      <ThemedView key={field} style={styles.group}>
        <ThemedText type="small">{required ? `${fieldLabels[field]} *` : fieldLabels[field]}</ThemedText>
        <TextInput
          accessibilityLabel={fieldLabels[field]}
          placeholderTextColor={theme.textSecondary}
          autoCapitalize={field === 'company_domain' ? 'none' : 'sentences'}
          keyboardType={keyboard}
          value={values[field]}
          onChangeText={(text) => update(field, text)}
          style={input}
        />
      </ThemedView>
    );
  }

  if (optionsState.status === 'loading') {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator accessibilityLabel="Cargando opciones" color={theme.text} />
      </ThemedView>
    );
  }
  if (optionsState.status === 'error') {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText accessibilityRole="alert" style={styles.error}>
          {optionsState.message}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
          onPress={retryOptions}
          style={[styles.button, { backgroundColor: theme.text }]}>
          <ThemedText style={{ color: theme.background }}>Reintentar</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const { options } = optionsState;
  const pickers: { field: 'stage' | 'sector' | 'country'; list: string[] }[] = [
    { field: 'stage', list: options.stages },
    { field: 'sector', list: options.sectors },
    { field: 'country', list: options.countries },
  ];
  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Predecir</ThemedText>
        <ThemedText themeColor="textSecondary">
          Completa los datos de la ronda. Los campos marcados con * son obligatorios.
        </ThemedText>

        {textField('year', 'number-pad', true)}
        {textField('founded_year', 'number-pad', true)}
        {pickers.map(({ field, list }) => (
          <ThemedView key={field} style={styles.group}>
            <ThemedText type="small">{fieldLabels[field]} *</ThemedText>
            <OptionPicker
              label={fieldLabels[field]}
              value={values[field]}
              options={list}
              onChange={(value) => update(field, value)}
            />
          </ThemedView>
        ))}

        <ThemedText type="smallBold">Opcionales</ThemedText>
        {OPTIONAL_FIELDS.map(({ field, keyboard }) => textField(field, keyboard))}

        {error ? (
          <ThemedText accessibilityRole="alert" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Estimar monto"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={() => void submit()}
          style={[styles.button, { backgroundColor: theme.text, opacity: busy ? 0.6 : 1 }]}>
          {busy ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <ThemedText style={{ color: theme.background }}>Estimar monto</ThemedText>
          )}
        </Pressable>

        {result ? <ResultCard result={result} /> : null}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, alignItems: 'center' },
  card: { width: '100%', maxWidth: 520, gap: Spacing.three },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.three, padding: Spacing.four },
  group: { gap: Spacing.one },
  input: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.three, fontSize: 16 },
  button: { borderRadius: Spacing.two, padding: Spacing.three, alignItems: 'center' },
  error: { color: '#D93025' },
});
