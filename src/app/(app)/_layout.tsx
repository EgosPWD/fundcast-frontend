import { Tabs } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useSession } from '@/auth/session';
import { ThemedText } from '@/components/themed-text';
import { Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        // Each screen renders its own PageHeader, so the app bar shows the product name
        // instead of repeating the tab title.
        headerTitle: 'Fundcast',
        headerRight: () => <SignOutButton />,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.border },
        headerTitleStyle: { color: theme.text, fontWeight: '700', fontSize: 17 },
        headerTintColor: theme.text,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
        tabBarStyle: { backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.border },
        sceneStyle: { backgroundColor: theme.background },
      }}>
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

const styles = StyleSheet.create({
  signOut: { paddingHorizontal: Spacing.three, minHeight: TouchTarget, justifyContent: 'center' },
});
