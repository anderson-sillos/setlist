import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import {
  getOAuthCallbackPath,
  PROTOTYPE_OAUTH_CODE,
  PROTOTYPE_OAUTH_STATE,
} from '@/features/auth/prototypeLinks';
import { spacing } from '@/theme/tokens';

interface InvitePrototypeScreenProps {
  readonly resumed?: string;
  readonly token?: string;
}

export function InvitePrototypeScreen({
  resumed,
  token,
}: InvitePrototypeScreenProps) {
  const callbackPath = token
    ? getOAuthCallbackPath({
        code: PROTOTYPE_OAUTH_CODE,
        inviteToken: token,
        state: PROTOTYPE_OAUTH_STATE,
      })
    : null;

  return (
    <Screen testID="invite-prototype">
      <View style={styles.header}>
        <Link href="/auth-prototype" replace asChild>
          <AppButton
            icon="back"
            label="Voltar ao protótipo"
            variant="secondary"
          />
        </Link>
        <AppText tone="accent" variant="eyebrow">
          Convite de desenvolvimento
        </AppText>
        <AppText accessibilityRole="header" variant="title">
          Convite para a banda
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
          <AppText variant="heading">Token preservado</AppText>
          <AppText tone="muted">
            O token recebido pela rota é mantido até o retorno do login.
          </AppText>
          <AppText selectable testID="invite-token" variant="heading">
            {token}
          </AppText>
          {resumed === '1' ? (
            <AppText tone="accent">Convite retomado após o login.</AppText>
          ) : null}
          {callbackPath ? (
            <Link href={callbackPath as Href} asChild>
              <AppButton
                icon="externalLink"
                label="Simular login social e retorno"
              />
            </Link>
          ) : null}
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
