import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import { AppVersionLabel } from '@/components/ui/AppVersionLabel';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { AuthErrorNotice } from '@/features/auth/AuthErrorNotice';
import { AuthLoadingState } from '@/features/auth/AuthLoadingState';
import { AuthProviderIcon } from '@/features/auth/AuthProviderIcon';
import { AppleSignInButton } from '@/features/auth/AppleSignInButton';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import {
  AuthFlowError,
  signInWithSocialProvider,
  type SocialAuthProvider,
} from '@/features/auth/authService';
import { getInvitePath, getSingleRouteParam } from '@/features/auth/authLinks';
import { legalUrls } from '@/features/legal/legalUrls';
import { spacing } from '@/theme/tokens';

type AuthState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly provider: SocialAuthProvider }
  | { readonly message: string; readonly status: 'error' };

export function AuthScreen() {
  const params = useLocalSearchParams<{
    auth_error?: string | string[];
    invite_token?: string | string[];
  }>();
  const router = useRouter();
  const inviteToken = getSingleRouteParam(params.invite_token);
  const hasOAuthError = getSingleRouteParam(params.auth_error) === 'oauth';
  const { setSession } = useAuthSession();
  const [authState, setAuthState] = useState<AuthState>(() =>
    hasOAuthError
      ? {
          message: 'Não foi possível concluir o login. Tente novamente.',
          status: 'error',
        }
      : { status: 'idle' },
  );

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
        const nextInviteToken = result.inviteToken ?? inviteToken;
        router.replace(
          (nextInviteToken
            ? getInvitePath(nextInviteToken, { resumed: true })
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
    <Screen contentStyle={styles.authContent} testID="auth-screen">
      <View style={styles.authLayout}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <AppLogo size={64} />
            <AppText accessibilityRole="header" variant="title">
              Setlist
            </AppText>
          </View>
          <AppText style={styles.introduction} tone="muted">
            Organize repertórios, prepare seus shows e leve as letras com você.
          </AppText>
        </View>

        <View style={styles.centerContent}>
          <AppText style={styles.loginExplanation} tone="muted">
            Entre com sua conta Google ou Apple. Se ainda não tiver banda, você
            pode aceitar um convite depois.
          </AppText>
          {inviteToken ? (
            <AppText style={styles.inviteNotice} tone="accent">
              O convite foi guardado e volta com você depois do login.
            </AppText>
          ) : null}

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
            <AppleSignInButton
              disabled={authState.status === 'loading'}
              onPress={() => void handleSignIn('apple')}
            />
            {authState.status === 'error' ? (
              <AuthErrorNotice message={authState.message} />
            ) : null}
          </Card>

          {inviteToken ? (
            <Link href={getInvitePath(inviteToken) as Href} replace asChild>
              <AppButton label="Voltar" variant="secondary" />
            </Link>
          ) : null}
        </View>

        <View style={styles.legalFooter}>
          <AppText style={styles.disclaimer} tone="muted" variant="caption">
            Ao entrar, você concorda com os Termos de uso.
          </AppText>
          <View style={styles.legalMetaRow}>
            <Pressable
              accessibilityRole="link"
              hitSlop={{ top: 8, bottom: 8 }}
              onPress={() => void Linking.openURL(legalUrls.terms)}
              style={styles.legalLink}
            >
              <AppText numberOfLines={1} tone="accent" variant="caption">
                Termos de uso
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              hitSlop={{ top: 8, bottom: 8 }}
              onPress={() => void Linking.openURL(legalUrls.privacy)}
              style={styles.legalLink}
            >
              <AppText numberOfLines={1} tone="accent" variant="caption">
                Política de privacidade
              </AppText>
            </Pressable>
            <View style={styles.versionPosition}>
              <AppVersionLabel align="left" compact />
            </View>
          </View>
        </View>
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
    maxWidth: Platform.OS === 'web' ? 460 : undefined,
    marginBottom: spacing.lg,
    width: '100%',
  },
  legalFooter: {
    alignItems: 'flex-start',
    alignSelf: 'center',
    maxWidth: 460,
    marginTop: spacing.xs,
    width: '100%',
  },
  disclaimer: {
    textAlign: 'left',
  },
  legalMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    justifyContent: 'flex-start',
    rowGap: 0,
    width: '100%',
  },
  versionPosition: {
    marginLeft: 'auto',
  },
  legalLink: {
    justifyContent: 'center',
    minHeight: 20,
  },
});
