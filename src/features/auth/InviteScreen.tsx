import { Link, useRouter, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import {
  acceptInvitation,
  getInvitationPreview,
  InvitationMutationError,
  type InvitationPreview,
} from '@/data/supabase/invitationMutations';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { useLastBandSelection } from '@/features/bands/LastBandSelection';
import { useAppData } from '@/providers/AppProviders';
import { spacing } from '@/theme/tokens';

interface InviteScreenProps {
  readonly authenticated?: string;
  readonly resumed?: string;
  readonly token?: string;
}

type InviteState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly message: string; readonly status: 'error' }
  | { readonly status: 'accepted' };

export function InviteScreen({
  authenticated,
  resumed,
  token,
}: InviteScreenProps) {
  const { replace: replaceRoute } = useRouter();
  const queryClient = useQueryClient();
  const { currentUserId } = useAppData();
  const { setLastBand } = useLastBandSelection();
  const { status: authStatus } = useAuthSession();
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [inviteState, setInviteState] = useState<InviteState>({
    status: 'idle',
  });
  const hasAuthenticatedContext =
    authStatus === 'authenticated' || authenticated === '1' || resumed === '1';
  const authPath = token
    ? ({
        pathname: '/auth',
        params: { invite_token: token },
      } as unknown as Href)
    : ('/auth' as Href);

  useEffect(() => {
    if (!token || !hasAuthenticatedContext) {
      return;
    }

    let active = true;

    void getInvitationPreview(token)
      .then((nextPreview) => {
        if (!active) {
          return;
        }

        if (nextPreview.alreadyAccepted) {
          replaceRoute('/' as Href);
          return;
        }

        setPreview(nextPreview);
        setPreviewError(null);
        setInviteState({ status: 'idle' });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setPreviewError(
          error instanceof InvitationMutationError
            ? error.message
            : 'Esse convite não está mais disponível. Gere outro para seguir o show.',
        );
        setInviteState({
          message: 'Convite indisponível.',
          status: 'error',
        });
      });

    return () => {
      active = false;
    };
  }, [hasAuthenticatedContext, replaceRoute, token]);

  async function handleAccept() {
    if (!token) {
      return;
    }

    setInviteState({ status: 'loading' });

    try {
      const bandId = await acceptInvitation(token);
      await queryClient.invalidateQueries({
        queryKey: ['bands', 'user', currentUserId],
        refetchType: 'all',
      });
      await setLastBand(bandId);
      setInviteState({ status: 'accepted' });
      replaceRoute(`/bands/${bandId}/band` as Href);
    } catch (error) {
      setInviteState({
        message:
          error instanceof InvitationMutationError
            ? error.message
            : 'Não foi possível aceitar o convite agora. Tente novamente.',
        status: 'error',
      });
    }
  }

  return (
    <Screen testID="invite-screen">
      <View style={styles.header}>
        <AppText tone="accent" variant="eyebrow">
          Convite para banda
        </AppText>
        <AppText accessibilityRole="header" variant="title">
          Você foi convidado
        </AppText>
        <AppText tone="muted">
          Entre e confirme sua entrada. O convite é de uso único e não fica
          salvo como texto no aparelho.
        </AppText>
      </View>

      {!token ? (
        <Card tone="accent" testID="invite-invalid">
          <AppText variant="heading">Convite sem token</AppText>
          <AppText tone="muted">
            O link não trouxe o identificador necessário para continuar.
          </AppText>
        </Card>
      ) : hasAuthenticatedContext ? (
        <Card style={styles.card} testID="invite-details">
          <AppText variant="heading">
            {preview?.bandName ?? 'Convite recebido'}
          </AppText>
          {preview?.label ? (
            <AppText tone="muted">Identificação: {preview.label}</AppText>
          ) : null}
          <AppText tone="muted">
            {preview
              ? `Válido até ${new Date(preview.expiresAt).toLocaleDateString('pt-BR')}.`
              : 'Conferindo se o convite ainda está no compasso…'}
          </AppText>
          {previewError ? (
            <AppText accessibilityRole="alert" style={styles.errorText}>
              {previewError}
            </AppText>
          ) : null}
          {inviteState.status === 'accepted' ? (
            <AppText tone="accent" testID="invite-authenticated">
              Entrada confirmada. A banda já está no seu repertório.
            </AppText>
          ) : (
            <AppButton
              disabled={
                inviteState.status === 'loading' ||
                Boolean(previewError) ||
                !preview
              }
              icon="check"
              label={
                inviteState.status === 'loading'
                  ? 'Conferindo…'
                  : 'Aceitar convite'
              }
              onPress={() => void handleAccept()}
            />
          )}
          {inviteState.status === 'error' && !previewError ? (
            <AppText accessibilityRole="alert" style={styles.errorText}>
              {inviteState.message}
            </AppText>
          ) : null}
        </Card>
      ) : (
        <Card style={styles.card} testID="invite-details">
          <AppText variant="heading">Convite recebido</AppText>
          <AppText tone="muted">
            Entre para conferir a banda e confirmar sua entrada. O token fica
            guardado apenas durante o retorno do login.
          </AppText>
          <Link href={authPath} replace asChild>
            <AppButton icon="login" label="Entrar para continuar" />
          </Link>
        </Card>
      )}

      <Link href="/" replace asChild>
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
  errorText: {
    color: '#b91c1c',
  },
});
