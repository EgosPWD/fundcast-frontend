import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { useSession } from '@/auth/session';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { PageHeader } from '@/components/page-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { PredictionRow } from './prediction-row';
import { usePredictionHistory } from './use-prediction-history';

/** S1.b: the caller's previous predictions (all of them for an admin), with input and result. */
export function HistoryScreen() {
  const { isAdmin } = useSession();
  const history = usePredictionHistory();
  const theme = useTheme();
  const items = history.data?.items ?? [];

  return (
    <ThemedView style={styles.container}>
      <PageHeader
        title="Historial de predicciones"
        subtitle="Cada línea es una estimación anterior. Toca una para ver los datos enviados."
        action={<Button label="Actualizar" variant="secondary" disabled={history.loading} onPress={history.refresh} />}
      />

      {history.error ? (
        <Notice tone="error" message={history.error} />
      ) : null}

      {history.loading && !history.data ? (
        <ActivityIndicator accessibilityLabel="Cargando historial" color={theme.accent} />
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
            history.error ? undefined : (
              <View style={styles.empty}>
                <ThemedText type="smallBold">Todavía no hay predicciones.</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Cuando estimes el monto de una ronda en la pestaña Predecir, aparecerá aquí.
                </ThemedText>
              </View>
            )
          }
        />
      )}

      <ThemedView style={[styles.pager, { borderTopColor: theme.border }]}>
        <Button
          label="Anterior"
          variant="secondary"
          disabled={!history.hasPrevious || history.loading}
          onPress={history.previous}
        />
        <ThemedText type="mono">{`Página ${history.page} de ${history.totalPages}`}</ThemedText>
        <Button
          label="Siguiente"
          variant="secondary"
          disabled={!history.hasNext || history.loading}
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
  list: { flexGrow: 1 },
  empty: { paddingVertical: Spacing.five, gap: Spacing.one },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
});
