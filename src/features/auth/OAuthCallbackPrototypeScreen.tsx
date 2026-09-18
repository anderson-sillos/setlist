import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { getInvitePath } from '@/features/auth/prototypeLinks';
import { spacing } from '@/theme/tokens';

interface OAuthCallbackPrototypeScreenProps {
  readonly code?: string;
  readonly error?: string;
  readonly inviteToken?: string;
  readonly state?: string;
}

export function OAuthCallbackPrototypeScreen({
  code,
  error,
  inviteToken,
  state,
}: OAuthCallbackPrototypeScreenProps) {
  const invitePath = inviteToken
    ? getInvitePath(inviteToken, { resumed: true })
    : '/auth-prototype';

  return (
    <Screen testID="oauth-callback-prototype">
      <View style={styles.header}>
        <AppText tone="accent" variant="eyebrow">
          Retorno OAuth de desenvolvimento
        </AppText>
        <AppText accessibilityRole="header" variant="title">
          Login retornou
        </AppText>
        <AppText tone="muted">
          Esta tela confirma quais parâmetros chegaram depois do retorno do
          provedor social. O login real será conectado ao Supabase em outra
          atividade.
        </AppText>
      </View>

      <Card style={styles.card} testID="oauth-callback-details">
        {error ? (
          <AppText tone="accent" variant="heading">
            Retorno com erro: {error}
          </AppText>
        ) : (
          <AppText tone="accent" variant="heading">
            Retorno recebido
          </AppText>
        )}
        <View style={styles.parameter}>
          <AppText tone="muted" variant="caption">
            code
          </AppText>
          <AppText selectable testID="oauth-code">
            {code ?? 'não informado'}
          </AppText>
        </View>
        <View style={styles.parameter}>
          <AppText tone="muted" variant="caption">
            state
          </AppText>
          <AppText selectable testID="oauth-state">
            {state ?? 'não informado'}
          </AppText>
        </View>
        <View style={styles.parameter}>
          <AppText tone="muted" variant="caption">
            invite_token
          </AppText>
          <AppText selectable testID="oauth-invite-token">
            {inviteToken ?? 'não informado'}
          </AppText>
        </View>
        <Link href={invitePath as Href} replace asChild>
          <AppButton
            icon="forward"
            label={inviteToken ? 'Retomar convite' : 'Voltar ao protótipo'}
            variant="secondary"
          />
        </Link>
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
    gap: spacing.lg,
  },
  parameter: {
    gap: spacing.xs,
  },
});
