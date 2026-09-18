import * as Linking from 'expo-linking';
import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import {
  getDevelopmentUrl,
  getInvitePath,
  getOAuthCallbackPath,
  PROTOTYPE_INVITE_TOKEN,
} from '@/features/auth/prototypeLinks';
import { spacing } from '@/theme/tokens';

const invitePath = getInvitePath(PROTOTYPE_INVITE_TOKEN);
const callbackPath = getOAuthCallbackPath({
  inviteToken: PROTOTYPE_INVITE_TOKEN,
});

export function AuthPrototypeScreen() {
  const inviteUrl = getDevelopmentUrl(invitePath);
  const callbackUrl = getDevelopmentUrl(callbackPath);

  return (
    <Screen testID="auth-prototype">
      <View style={styles.header}>
        <Link href="/" replace asChild>
          <AppButton icon="back" label="Fechar protótipo" variant="secondary" />
        </Link>
        <AppText tone="accent" variant="eyebrow">
          Tarefa 3.4 · protótipo de convite e OAuth
        </AppText>
        <AppText accessibilityRole="header" variant="title">
          Links de acesso
        </AppText>
        <AppText tone="muted">
          As rotas abaixo simulam um convite recebido e o retorno do login
          social. Nenhuma conta ou convite real é criado neste ensaio.
        </AppText>
      </View>

      <Card style={styles.card} testID="invite-prototype-card">
        <AppText variant="heading">Convite de desenvolvimento</AppText>
        <AppText tone="muted" variant="caption" selectable>
          {inviteUrl}
        </AppText>
        <View style={styles.actions}>
          <Link href={invitePath as Href} asChild>
            <AppButton icon="externalLink" label="Abrir rota de convite" />
          </Link>
          <AppButton
            icon="externalLink"
            label="Abrir URL do convite"
            onPress={() => void Linking.openURL(inviteUrl)}
            variant="secondary"
          />
        </View>
      </Card>

      <Card style={styles.card} testID="oauth-prototype-card">
        <AppText variant="heading">Retorno OAuth de desenvolvimento</AppText>
        <AppText tone="muted" variant="caption" selectable>
          {callbackUrl}
        </AppText>
        <View style={styles.actions}>
          <Link href={callbackPath as Href} asChild>
            <AppButton icon="externalLink" label="Simular retorno OAuth" />
          </Link>
          <AppButton
            icon="externalLink"
            label="Abrir URL de retorno"
            onPress={() => void Linking.openURL(callbackUrl)}
            variant="secondary"
          />
        </View>
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
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
});
