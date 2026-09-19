import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { AuthErrorNotice } from '@/features/auth/AuthErrorNotice';
import { AuthLoadingState } from '@/features/auth/AuthLoadingState';
import { AuthProviderIcon } from '@/features/auth/AuthProviderIcon';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { AuthSuccessCard } from '@/features/auth/AuthSuccessCard';
import {
  AuthFlowError,
  signInWithSocialProvider,
  type SocialAuthProvider,
} from '@/features/auth/authService';
import { getInvitePath, getSingleRouteParam } from '@/features/auth/authLinks';
import { radii, spacing } from '@/theme/tokens';

type AuthState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly provider: SocialAuthProvider }
  | {
      readonly email?: string;
      readonly inviteToken?: string;
      readonly status: 'success';
    }
  | { readonly message: string; readonly status: 'error' };

export function AuthScreen() {
  const params = useLocalSearchParams<{ invite_token?: string | string[] }>();
  const router = useRouter();
  const inviteToken = getSingleRouteParam(params.invite_token);
  const { setSession } = useAuthSession();
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
        if (result.session) {
          setSession(result.session);
        }
        setAuthState({
          email: result.session?.user.email,
          inviteToken: result.inviteToken ?? inviteToken,
          status: 'success',
        });
      }
    } catch (error) {
      const message =
        error instanceof AuthFlowError
          ? error.message
          : 'Não foi possível concluir o login agora. Tente novamente.';
      setAuthState({ message, status: 'error' });
    }
  }

  function handleContinue() {
    if (authState.status !== 'success') {
      return;
    }

    router.replace(
      (authState.inviteToken
        ? getInvitePath(authState.inviteToken, { resumed: true })
        : '/') as Href,
    );
  }

  const isSuccess = authState.status === 'success';

  return (
    <Screen contentStyle={styles.authContent} testID="auth-screen">
      <View style={styles.authLayout}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image
              accessibilityLabel="Logo do Setlist"
              accessibilityRole="image"
              source={require('../../../assets/icons/app-icon-512.png')}
              style={styles.logo}
            />
            <AppText accessibilityRole="header" variant="title">
              Setlist
            </AppText>
          </View>
          <AppText style={styles.introduction} tone="muted">
            Organize repertórios, prepare seus shows e leve as letras com você.
          </AppText>
        </View>

        <View style={styles.centerContent}>
          {isSuccess ? (
            <AppText style={styles.loginExplanation} tone="muted">
              Seu acesso está pronto. Confira a confirmação abaixo.
            </AppText>
          ) : (
            <AppText style={styles.loginExplanation} tone="muted">
              Entre com sua conta Google. O acesso com Apple chegará em breve.
              Se ainda não tiver banda, você pode aceitar um convite depois.
            </AppText>
          )}
          {inviteToken && !isSuccess ? (
            <AppText style={styles.inviteNotice} tone="accent">
              O convite foi guardado e volta com você depois do login.
            </AppText>
          ) : null}

          {isSuccess ? (
            <AuthSuccessCard
              email={authState.email}
              onContinue={handleContinue}
              withInvite={Boolean(authState.inviteToken)}
            />
          ) : (
            <Card style={styles.card}>
              {authState.status === 'loading' ? (
                <AuthLoadingState
                  label={
                    authState.provider === 'google'
                      ? 'Abrindo Google…'
                      : 'Abrindo Apple…'
                  }
                />
              ) : null}
              <AppButton
                disabled={authState.status === 'loading'}
                leading={<AuthProviderIcon provider="google" size={28} />}
                label="Continuar com Google"
                onPress={() => void handleSignIn('google')}
                testID="auth-google"
                variant="secondary"
              />
              <AppButton
                disabled
                leading={<AuthProviderIcon provider="apple" size={28} />}
                label="Continuar com Apple (em breve)"
                onPress={() => undefined}
                testID="auth-apple"
                variant="secondary"
              />
              {authState.status === 'error' ? (
                <AuthErrorNotice message={authState.message} />
              ) : null}
            </Card>
          )}

          {!isSuccess && inviteToken ? (
            <Link href={getInvitePath(inviteToken) as Href} replace asChild>
              <AppButton label="Voltar" variant="secondary" />
            </Link>
          ) : null}
        </View>

        <AppText style={styles.disclaimer} tone="muted" variant="caption">
          Ao continuar, você concorda com os termos de uso e a política de
          privacidade do Setlist.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  authContent: {
    flexGrow: 1,
  },
  authLayout: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
    marginTop: spacing.lg,
    width: '100%',
  },
  brand: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  logo: {
    borderRadius: radii.lg,
    height: 88,
    width: 88,
  },
  introduction: {
    maxWidth: 460,
    textAlign: 'center',
  },
  loginExplanation: {
    maxWidth: 460,
    textAlign: 'center',
  },
  inviteNotice: {
    textAlign: 'center',
  },
  card: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  disclaimer: {
    marginTop: spacing.xl,
    maxWidth: 460,
    textAlign: 'center',
  },
});
