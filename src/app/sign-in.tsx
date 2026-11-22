import { Link } from 'expo-router';

import { useSession } from '@/auth/session';
import { AuthForm } from '@/components/auth-form';
import { ThemedText } from '@/components/themed-text';

export default function SignInScreen() {
  const { signIn } = useSession();
  return (
    <AuthForm
      title="Iniciar sesión"
      submitLabel="Iniciar sesión"
      onSubmit={signIn}
      footer={
        <Link href="/register">
          <ThemedText type="link">Crear una cuenta</ThemedText>
        </Link>
      }
    />
  );
}
