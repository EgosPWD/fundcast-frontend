import { Link } from 'expo-router';

import { useSession } from '@/auth/session';
import { AuthForm } from '@/components/auth-form';
import { ThemedText } from '@/components/themed-text';

export default function RegisterScreen() {
  const { signUp } = useSession();
  return (
    <AuthForm
      title="Crear cuenta (mínimo 8 caracteres)"
      submitLabel="Crear cuenta"
      onSubmit={signUp}
      footer={
        <Link href="/sign-in">
          <ThemedText type="link">Ya tengo cuenta</ThemedText>
        </Link>
      }
    />
  );
}
