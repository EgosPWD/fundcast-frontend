import { Tabs } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useSession } from '@/auth/session';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

function SignOutButton() {
  const { signOut } = useSession();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
      onPress={() => void signOut()}
      style={styles.signOut}>
      <ThemedText type="link">Salir</ThemedText>
    </Pressable>
  );
}

export default function AppLayout() {
  const { isAdmin } = useSession();
  return (
    <Tabs screenOptions={{ headerRight: () => <SignOutButton /> }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="predict" options={{ title: 'Predecir' }} />
      <Tabs.Screen name="history" options={{ title: 'Historial' }} />
      <Tabs.Screen name="metrics" options={{ title: 'Métricas' }} />
      <Tabs.Protected guard={isAdmin}>
        <Tabs.Screen name="training" options={{ title: 'Entrenamiento' }} />
      </Tabs.Protected>
    </Tabs>
  );
}

const styles = StyleSheet.create({ signOut: { paddingHorizontal: Spacing.three } });
