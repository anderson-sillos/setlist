import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { AuthErrorNotice } from '@/features/auth/AuthErrorNotice';
import { AuthLoadingState } from '@/features/auth/AuthLoadingState';
import { AuthSuccessCard } from '@/features/auth/AuthSuccessCard';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import {
  AuthFlowError,
  completeOAuthCallback,
} from '@/features/auth/authService';
import { getInvitePath } from '@/features/auth/authLinks';
import { spacing } from '@/theme/tokens';

interface OAuthCallbackScreenProps {
  readonly code?: string;
  readonly error?: string;
  readonly errorDescription?: string;
  readonly flowId?: string;
  readonly inviteToken?: string;
  readonly state?: string;
}

type CallbackState =
  | { readonly status: 'loading' }
  | {
      readonly email?: string;
      readonly inviteToken?: string;
      readonly status: 'success';
    }
  | { readonly message: string; readonly status: 'error' };

export function OAuthCallbackScreen({
  code,
  error,
  errorDescription,
  flowId,
  inviteToken,
  state,
}: OAuthCallbackScreenProps) {
  const router = useRouter();
  const { setSession } = useAuthSession();
  const [callbackState, setCallbackState] = useState<CallbackState>({
    status: 'loading',
  });

  useEffect(() => {
    let active = true;

    void completeOAuthCallback({
      code,
      error,
      errorDescription,
      flowId,
      inviteToken,
      state,
    })
      .then((result) => {
        if (!active) {
          return;
        }

        setCallbackState({
          email: result.session?.user.email,
          inviteToken: result.inviteToken,
          status: 'success',
        });
        if (result.session) {
          setSession(result.session);
        }
      })
      .catch((callbackError: unknown) => {
        if (!active) {
          return;
        }

        setCallbackState({
          message:
            callbackError instanceof AuthFlowError
              ? callbackError.message
              : 'O retorno do login não pôde ser concluído. Tente novamente.',
          status: 'error',
        });
      });

    return () => {
      active = false;
    };
  }, [
    code,
    error,
    errorDescription,
    flowId,
    inviteToken,
    router,
    setSession,
    state,
  ]);

  function handleContinue() {
    if (callbackState.status !== 'success') {
      return;
    }

    router.replace(
      (callbackState.inviteToken
        ? getInvitePath(callbackState.inviteToken, { resumed: true })
        : '/') as Href,
    );
  }

  return (
    <Screen testID="oauth-callback-screen">
      <View style={styles.header}>
        <AppText tone="accent" variant="eyebrow">
          Retorno do login
        </AppText>
        <AppText accessibilityRole="header" variant="title">
          {callbackState.status === 'success'
            ? 'Tudo certo!'
            : 'Conferindo acesso…'}
        </AppText>
      </View>

      {callbackState.status === 'loading' ? (
        <Card style={styles.card}>
          <AuthLoadingState label="Só um instante, estamos conferindo tudo." />
        </Card>
      ) : callbackState.status === 'success' ? (
        <AuthSuccessCard
          email={callbackState.email}
          onContinue={handleContinue}
          testID="oauth-success-card"
          withInvite={Boolean(callbackState.inviteToken)}
        />
      ) : (
        <Card style={styles.card}>
          <AppText accessibilityRole="alert" tone="accent" variant="heading">
            Não foi possível entrar
          </AppText>
          <AuthErrorNotice
            message={callbackState.message}
            testID="oauth-error"
          />
          <AppButton
            icon="back"
            label="Tentar novamente"
            onPress={() => router.replace('/auth' as Href)}
            variant="secondary"
          />
        </Card>
      )}
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
  },
});
