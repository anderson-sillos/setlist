import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import {
  AccountDeletionError,
  deleteAccount,
} from '@/data/supabase/accountMutations';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { signOutLocally } from '@/features/auth/authService';
import { useLastBandSelection } from '@/features/bands/LastBandSelection';
import { AppNavigationShell } from '@/features/navigation/AppNavigationShell';
import { colors, spacing } from '@/theme/tokens';
import { AccountDeletionDialog } from './AccountDeletionDialog';

type AccountScreenProps = {
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
};

function getAccountName(
  metadata: Record<string, unknown>,
  email: string | undefined,
): string {
  const metadataName = ['full_name', 'name', 'preferred_username']
    .map((key) => metadata[key])
    .find(
      (value): value is string =>
        typeof value === 'string' && Boolean(value.trim()),
    );

  return metadataName ?? email ?? 'Usuário autenticado';
}

export function AccountScreen({
  viewportHeight,
  viewportWidth,
}: AccountScreenProps) {
  const router = useRouter();
  const { session, setSession } = useAuthSession();
  const { clearLastBand } = useLastBandSelection();
  const [deletionVisible, setDeletionVisible] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const [deletionSubmitting, setDeletionSubmitting] = useState(false);
  const email = session?.user.email;
  const name = getAccountName(session?.user.user_metadata ?? {}, email);

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
          <AppText accessibilityRole="header" variant="heading">
            {name}
          </AppText>
          <AppText tone="muted">{email ?? 'E-mail não informado'}</AppText>
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
});
