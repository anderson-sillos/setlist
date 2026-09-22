import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  AccountDeletionError,
  deleteAccount,
} from '@/data/supabase/accountMutations';
import {
  ProfileMutationError,
  updateMyDisplayName,
  type UserProfile,
} from '@/data/supabase/profileMutations';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { signOutLocally } from '@/features/auth/authService';
import { useLastBandSelection } from '@/features/bands/LastBandSelection';
import { AppNavigationShell } from '@/features/navigation/AppNavigationShell';
import { colors, spacing } from '@/theme/tokens';
import { AccountDeletionDialog } from './AccountDeletionDialog';
import { ProfileDisplayNameDialog } from './ProfileDisplayNameDialog';
import { useCurrentProfile } from './useCurrentProfile';

type AccountScreenProps = {
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
};

export function AccountScreen({
  viewportHeight,
  viewportWidth,
}: AccountScreenProps) {
  const router = useRouter();
  const { session, setSession } = useAuthSession();
  const { clearLastBand } = useLastBandSelection();
  const queryClient = useQueryClient();
  const profileQuery = useCurrentProfile();
  const [deletionVisible, setDeletionVisible] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const [deletionSubmitting, setDeletionSubmitting] = useState(false);
  const [nameEditorVisible, setNameEditorVisible] = useState(false);
  const [nameEditorError, setNameEditorError] = useState<string | null>(null);
  const [nameEditorSubmitting, setNameEditorSubmitting] = useState(false);
  const [nameUpdated, setNameUpdated] = useState(false);
  const name =
    profileQuery.data?.displayName ??
    (session
      ? profileQuery.isLoading
        ? 'Carregando perfil…'
        : 'Nome não disponível'
      : 'Usuário autenticado');
  const email = profileQuery.data?.email;

  const openDeletion = () => {
    setDeletionError(null);
    setDeletionVisible(true);
  };

  const closeDeletion = () => {
    if (deletionSubmitting) {
      return;
    }

    setDeletionVisible(false);
    setDeletionError(null);
  };

  const handleDeleteAccount = async () => {
    setDeletionError(null);
    setDeletionSubmitting(true);

    try {
      await deleteAccount();
      await clearLastBand();
      await signOutLocally().catch(() => undefined);
      setSession(null);
      router.replace('/auth');
    } catch (error) {
      setDeletionError(
        error instanceof AccountDeletionError
          ? error.message
          : 'Não foi possível excluir a conta agora. Tente novamente.',
      );
    } finally {
      setDeletionSubmitting(false);
    }
  };

  const openNameEditor = () => {
    setNameEditorError(null);
    setNameUpdated(false);
    setNameEditorVisible(true);
  };

  const closeNameEditor = () => {
    if (nameEditorSubmitting) {
      return;
    }

    setNameEditorVisible(false);
    setNameEditorError(null);
  };

  const handleSaveDisplayName = async (displayName: string) => {
    setNameEditorError(null);
    setNameEditorSubmitting(true);

    try {
      const savedName = await updateMyDisplayName(displayName);

      if (session?.user.id) {
        queryClient.setQueryData<UserProfile | null>(
          ['profiles', session.user.id],
          (currentProfile) =>
            currentProfile
              ? { ...currentProfile, displayName: savedName }
              : currentProfile,
        );
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['profiles', session.user.id],
          }),
          queryClient.invalidateQueries({ queryKey: ['bands'] }),
        ]);
      }

      setNameUpdated(true);
      setNameEditorVisible(false);
    } catch (error) {
      setNameEditorError(
        error instanceof ProfileMutationError
          ? error.message
          : 'Não foi possível atualizar seu nome agora. Tente novamente.',
      );
    } finally {
      setNameEditorSubmitting(false);
    }
  };

  return (
    <AppNavigationShell
      backHref="/"
      currentRoute="/account"
      screenKind="detail"
      title="Perfil e conta"
      testID="account-screen"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.identityRow}>
            <UserAvatar
              avatarUrl={profileQuery.data?.avatarUrl}
              displayName={name}
              size={52}
            />
            <View style={styles.identityCopy}>
              <AppText accessibilityRole="header" variant="heading">
                {name}
              </AppText>
              <AppText tone="muted">{email ?? 'E-mail não informado'}</AppText>
            </View>
          </View>
          {nameUpdated ? (
            <AppText accessibilityLiveRegion="polite" tone="accent">
              Nome de exibição atualizado.
            </AppText>
          ) : null}
          {profileQuery.isError ? (
            <AppText accessibilityRole="alert" tone="muted">
              Não conseguimos carregar os dados do perfil.
            </AppText>
          ) : null}
          {session ? (
            <AppButton
              disabled={!profileQuery.data || profileQuery.isLoading}
              icon="edit"
              label="Editar nome de exibição"
              onPress={openNameEditor}
              variant="secondary"
            />
          ) : null}
          {profileQuery.isError ? (
            <AppButton
              icon="forward"
              label="Tentar novamente"
              onPress={() => void profileQuery.refetch()}
              variant="secondary"
            />
          ) : null}
          <AppText tone="muted">
            Sua conta pode participar de várias bandas. A exclusão da conta não
            remove o conteúdo das bandas que continuarão ativas.
          </AppText>
        </Card>

        <Card style={styles.dangerCard}>
          <AppText accessibilityRole="header" variant="heading">
            Excluir conta
          </AppText>
          <AppText>
            Remove seu perfil, suas sessões e a seleção local da última banda.
            Essa ação não pode ser desfeita.
          </AppText>
          <AppButton
            accessibilityLabel="Abrir exclusão da conta"
            icon="close"
            label="Excluir minha conta"
            onPress={openDeletion}
            variant="secondary"
          />
        </Card>
      </View>

      <AccountDeletionDialog
        errorMessage={deletionError}
        isSubmitting={deletionSubmitting}
        onClose={closeDeletion}
        onConfirm={() => void handleDeleteAccount()}
        visible={deletionVisible}
      />
      <ProfileDisplayNameDialog
        key={`${nameEditorVisible}:${profileQuery.data?.displayName ?? ''}`}
        errorMessage={nameEditorError}
        initialName={profileQuery.data?.displayName ?? ''}
        isSubmitting={nameEditorSubmitting}
        onClose={closeNameEditor}
        onSave={(displayName) => void handleSaveDisplayName(displayName)}
        visible={nameEditorVisible}
      />
    </AppNavigationShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  dangerCard: {
    borderColor: colors.line,
    gap: spacing.md,
  },
  profileCard: {
    gap: spacing.md,
  },
  identityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  identityCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
});
