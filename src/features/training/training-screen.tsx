import { ScrollView, StyleSheet } from 'react-native';

import { useSession } from '@/auth/session';
import { PageHeader } from '@/components/page-header';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

import { RetrainSection } from './retrain-section';
import { UploadSection } from './upload-section';

/** Admin-only screen (the tab is guarded; the API also answers 403 to other roles). */
export function TrainingScreen() {
  const { token } = useSession();
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          title="Entrenamiento"
          subtitle="Dos pasos: primero carga datos nuevos, después reentrena el modelo para usarlos."
        />
        <UploadSection token={token} />
        <RetrainSection token={token} />
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
});
