import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';

import { useSession } from '@/auth/session';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { PredictionRow } from './prediction-row';
import { usePredictionHistory } from './use-prediction-history';

function PagerButton({ label, enabled, onPress }: { label: string; enabled: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      style={[styles.button, { backgroundColor: theme.text, opacity: enabled ? 1 : 0.4 }]}>
      <ThemedText type="small" style={{ color: theme.background }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** S1.b: the caller's previous predictions (all of them for an admin), with input and result. */
export function HistoryScreen() {
  const { isAdmin } = useSession();
  const history = usePredictionHistory();
  const items = history.data?.items ?? [];

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle">Historial de predicciones</ThemedText>
        <PagerButton label="Actualizar" enabled={!history.loading} onPress={history.refresh} />
      </ThemedView>

      {history.error ? (
        <ThemedText accessibilityRole="alert" style={styles.error}>
          {history.error}
        </ThemedText>
      ) : null}

      {history.loading && !history.data ? (
        <ActivityIndicator accessibilityLabel="Cargando historial" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PredictionRow item={item} showUser={isAdmin} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={history.loading} onRefresh={history.refresh} />
          }
          ListEmptyComponent={
            history.error ? undefined : <ThemedText themeColor="textSecondary">Todavía no hay predicciones.</ThemedText>
          }
        />
      )}

      <ThemedView style={styles.pager}>
        <PagerButton
          label="Anterior"
          enabled={history.hasPrevious && !history.loading}
          onPress={history.previous}
        />
        <ThemedText type="small">{`Página ${history.page} de ${history.totalPages}`}</ThemedText>
        <PagerButton
          label="Siguiente"
          enabled={history.hasNext && !history.loading}
          onPress={history.next}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  list: { gap: Spacing.two, flexGrow: 1 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  button: { borderRadius: Spacing.two, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  error: { color: '#D93025' },
});
