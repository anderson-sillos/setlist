import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/theme/tokens';

interface InviteScreenProps {
  readonly authenticated?: string;
  readonly resumed?: string;
  readonly token?: string;
}

export function InviteScreen({
  authenticated,
  resumed,
  token,
}: InviteScreenProps) {
  const authPath = token
    ? ({
        pathname: '/auth',
        params: { invite_token: token },
      } as unknown as Href)
    : ('/auth' as Href);

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
          Entre com Google ou Apple para revisar e confirmar sua entrada na
          banda.
        </AppText>
      </View>

      {!token ? (
        <Card tone="accent" testID="invite-invalid">
          <AppText variant="heading">Convite sem token</AppText>
          <AppText tone="muted">
            O link não trouxe o identificador necessário para continuar.
          </AppText>
        </Card>
      ) : (
        <Card style={styles.card} testID="invite-details">
          <AppText variant="heading">Convite recebido</AppText>
          <AppText tone="muted">
            O token permanece protegido durante o login e não é salvo como
            conteúdo do aplicativo.
          </AppText>
          <AppText selectable testID="invite-token" variant="heading">
            {token}
          </AppText>
          {authenticated === '1' || resumed === '1' ? (
            <AppText tone="accent" testID="invite-authenticated">
              Login concluído. A confirmação de entrada será habilitada na
              próxima etapa.
            </AppText>
          ) : (
            <Link href={authPath} replace asChild>
              <AppButton icon="login" label="Entrar para continuar" />
            </Link>
          )}
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
});
