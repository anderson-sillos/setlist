import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import {
  AuthFlowError,
  completeOAuthCallback,
} from '@/features/auth/authService';
import { getInvitePath } from '@/features/auth/prototypeLinks';
import { spacing } from '@/theme/tokens';

interface OAuthCallbackScreenProps {
  readonly code?: string;
  readonly error?: string;
  readonly errorDescription?: string;
  readonly inviteToken?: string;
  readonly state?: string;
}

type CallbackState =
  | { readonly status: 'loading' }
  | { readonly message: string; readonly status: 'error' };

export function OAuthCallbackScreen({
  code,
  error,
  errorDescription,
  inviteToken,
  state,
}: OAuthCallbackScreenProps) {
  const router = useRouter();
  const [callbackState, setCallbackState] = useState<CallbackState>({
    status: 'loading',
  });

  useEffect(() => {
    let active = true;

    void completeOAuthCallback({
      code,
      error,
      errorDescription,
      inviteToken,
      state,
    })
      .then((result) => {
        if (!active) {
          return;
        }

        router.replace(
          (result.inviteToken
            ? getInvitePath(result.inviteToken, { resumed: true })
            : '/') as Href,
        );
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
  }, [code, error, errorDescription, inviteToken, router, state]);

  return (
    <Screen testID="oauth-callback-screen">
      <View style={styles.header}>
        <AppText tone="accent" variant="eyebrow">
          Retorno do login
        </AppText>
        <AppText accessibilityRole="header" variant="title">
          Conferindo acesso…
        </AppText>
      </View>

      <Card style={styles.card}>
        {callbackState.status === 'loading' ? (
          <AppText tone="muted">
            Só um instante, estamos conferindo tudo.
          </AppText>
        ) : (
          <>
            <AppText accessibilityRole="alert" tone="accent" variant="heading">
              Não foi possível entrar
            </AppText>
            <AppText tone="muted">{callbackState.message}</AppText>
            <AppButton
              icon="back"
              label="Tentar novamente"
              onPress={() => router.replace('/auth' as Href)}
              variant="secondary"
            />
          </>
        )}
      </Card>
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
