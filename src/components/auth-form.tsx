import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ApiError } from '@/api/client';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AuthFormProps {
  title: string;
  submitLabel: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  footer: React.ReactNode;
}

export function AuthForm({ title, submitLabel, onSubmit, footer }: AuthFormProps) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('Escribe tu email y tu contraseña.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onSubmit(trimmed, password);
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : 'Algo salió mal. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedView style={styles.brand}>
          <ThemedText type="title" style={styles.wordmark}>
            Fundcast
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Estima cuánto levantará una startup en su próxima ronda de financiación.
          </ThemedText>
        </ThemedView>
        <ThemedText type="label" themeColor="textSecondary" style={[styles.heading, { borderTopColor: theme.border }]}>
          {title}
        </ThemedText>
        <TextField
          label="Email"
          placeholder="tu@correo.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Contraseña"
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={() => void submit()}
        />
        {error ? <Notice tone="error" message={error} /> : null}
        <Button label={submitLabel} busy={busy} onPress={() => void submit()} />
        <ThemedView style={styles.footer}>{footer}</ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  card: { width: '100%', maxWidth: 400, gap: Spacing.three },
  brand: { gap: Spacing.two, paddingBottom: Spacing.two },
  wordmark: { letterSpacing: -1 },
  heading: { borderTopWidth: 1, paddingTop: Spacing.three },
  footer: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
});
