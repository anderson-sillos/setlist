import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import {
  AuthFlowError,
  signInWithSocialProvider,
  type SocialAuthProvider,
} from '@/features/auth/authService';
import {
  getInvitePath,
  getSingleRouteParam,
} from '@/features/auth/prototypeLinks';
import { spacing } from '@/theme/tokens';

type AuthState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly provider: SocialAuthProvider }
  | { readonly message: string; readonly status: 'error' };

export function AuthScreen() {
  const params = useLocalSearchParams<{ invite_token?: string | string[] }>();
  const router = useRouter();
  const inviteToken = getSingleRouteParam(params.invite_token);
  const [authState, setAuthState] = useState<AuthState>({ status: 'idle' });

  async function handleSignIn(provider: SocialAuthProvider) {
    setAuthState({ provider, status: 'loading' });

    try {
      const result = await signInWithSocialProvider(provider, inviteToken);

      if (result.status === 'cancelled') {
        setAuthState({
          message: 'Login cancelado. Sem drama: tente de novo quando quiser.',
          status: 'error',
        });
        return;
      }

      if (result.status === 'authenticated') {
        router.replace(
          (inviteToken
            ? getInvitePath(inviteToken, { resumed: true })
            : '/') as Href,
        );
      }
    } catch (error) {
      const message =
        error instanceof AuthFlowError
          ? error.message
          : 'Não foi possível concluir o login agora. Tente novamente.';
      setAuthState({ message, status: 'error' });
    }
  }

  return (
    <Screen testID="auth-screen">
      <View style={styles.header}>
        <AppText tone="accent" variant="eyebrow">
          Acesso ao Setlist
        </AppText>
        <AppText accessibilityRole="header" variant="title">
          Entre para continuar
        </AppText>
        <AppText tone="muted">
          Use sua conta Google ou Apple. Você pode entrar mesmo antes de
          escolher uma banda.
        </AppText>
        {inviteToken ? (
          <AppText tone="accent">
            O convite foi guardado e volta com você depois do login.
          </AppText>
        ) : null}
      </View>

      <Card style={styles.card}>
        <AppButton
          disabled={authState.status === 'loading'}
          icon="login"
          label={
            authState.status === 'loading' && authState.provider === 'google'
              ? 'Abrindo Google…'
              : 'Continuar com Google'
          }
          onPress={() => void handleSignIn('google')}
          testID="auth-google"
        />
        <AppButton
          disabled={authState.status === 'loading'}
          icon="login"
          label={
            authState.status === 'loading' && authState.provider === 'apple'
              ? 'Abrindo Apple…'
              : 'Continuar com Apple'
          }
          onPress={() => void handleSignIn('apple')}
          testID="auth-apple"
          variant="secondary"
        />
        {authState.status === 'error' ? (
          <AppText accessibilityRole="alert" tone="accent" testID="auth-error">
            {authState.message}
          </AppText>
        ) : null}
      </Card>

      <Link
        href={inviteToken ? (getInvitePath(inviteToken) as Href) : '/'}
        replace
        asChild
      >
        <AppButton label="Voltar" variant="secondary" />
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  card: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
});
