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
import { defaultPredictForm, fieldLabels, type PredictField, validatePredictForm } from './validation';

type OptionsState =
  | { status: 'loading' }
  | { status: 'ready'; options: OptionsResponse }
  | { status: 'error'; message: string };

function errorMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return 'Algo salió mal. Inténtalo de nuevo.';
  if (e.status === 503) return 'No hay un modelo activo todavía.';
  return e.detail;
}

const ROUND_YEARS = Array.from({ length: 8 }, (_, i) => String(2019 + i));
const FIRST_FOUNDED_YEAR = 2000;

function foundedYears(roundYear: string): string[] {
  const last = /^\d{4}$/.test(roundYear) ? Number(roundYear) : 2026;
  // Newest first: recent founding years are the common case.
  return Array.from({ length: Math.max(last - FIRST_FOUNDED_YEAR + 1, 0) }, (_, i) => String(last - i));
}

export function PredictionForm() {
  const theme = useTheme();
  const { token } = useSession();
  const [optionsState, setOptionsState] = useState<OptionsState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [values, setValues] = useState(defaultPredictForm);
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
    setValues((current) => {
      const next = { ...current, [field]: text };
      // Dependent fields: a city belongs to its country; a founding year cannot follow the round year.
      if (field === 'country' && text !== current.country) next.city = '';
      if (field === 'year' && next.founded_year && Number(next.founded_year) > Number(text)) next.founded_year = '';
      return next;
    });
    // The shown estimate belongs to the previous inputs: hide it as soon as they change.
    setResult(null);
  }

  async function submit() {
    const validation = validatePredictForm(values);
    if (!validation.ok) {
      setResult(null);
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
  const cities = options.cities_by_country[values.country] ?? [];
  const hasPreviousRounds = Number(values.prev_rounds) > 0;
  const picker = (
    field: PredictField,
    list: string[],
    extra: { required?: boolean; disabled?: boolean; allowFreeText?: boolean; emptyLabel?: string } = {},
  ) => (
    <ThemedView key={field} style={styles.group}>
      <ThemedText type="small">{extra.required ? `${fieldLabels[field]} *` : fieldLabels[field]}</ThemedText>
      <OptionPicker
        label={fieldLabels[field]}
        value={values[field]}
        options={list}
        disabled={extra.disabled}
        allowFreeText={extra.allowFreeText}
        emptyLabel={extra.emptyLabel}
        onChange={(value) => update(field, value)}
      />
    </ThemedView>
  );
  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Predecir</ThemedText>
        <ThemedText themeColor="textSecondary">
          Completa los datos de la ronda. Los campos marcados con * son obligatorios.
        </ThemedText>

        {picker('year', ROUND_YEARS, { required: true })}
        {picker('founded_year', foundedYears(values.year), { required: true })}
        {picker('stage', options.stages, { required: true })}
        {picker('sector', options.sectors, { required: true })}
        {picker('country', options.countries, { required: true })}

        <ThemedText type="smallBold">Opcionales</ThemedText>
        {picker('city', cities, { disabled: !values.country, emptyLabel: 'Sin especificar' })}
        {textField('investor_count', 'number-pad')}
        {picker('lead_investor', options.lead_investors, { allowFreeText: true, emptyLabel: 'Sin especificar' })}
        {textField('news_mentions', 'number-pad')}
        {picker('news_source', options.news_sources, { emptyLabel: 'Otra / no está en la lista' })}
        {textField('company_domain')}
        <ThemedText type="small" themeColor="textSecondary">
          Si el dominio existe en los datos, se usa su historial en lugar de los campos manuales de la ronda anterior.
        </ThemedText>
        {textField('prev_rounds', 'number-pad')}
        {hasPreviousRounds ? textField('prev_amount_usd', 'decimal-pad') : null}

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
