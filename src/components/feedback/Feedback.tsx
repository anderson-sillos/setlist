import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  type FeedbackMessageKey,
  getFeedbackMessage,
} from '@/components/feedback/feedbackMessages';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface MessageSelectionProps {
  readonly messageKey: FeedbackMessageKey;
  readonly variation?: number;
}

interface ErrorFeedbackProps extends Partial<MessageSelectionProps> {
  readonly onRetry?: () => void;
  readonly title?: string;
}

interface UnavailableFeedbackProps extends Partial<MessageSelectionProps> {
  readonly title?: string;
}

export type ConnectionStatus = 'offline-available' | 'required' | 'restored';

interface ConnectionBannerProps {
  readonly onRetry?: () => void;
  readonly status: ConnectionStatus;
  readonly variation?: number;
}

interface TemporaryFeedbackProps extends MessageSelectionProps {
  readonly actionLabel?: string;
  readonly durationMs?: number;
  readonly onAction?: () => void;
  readonly onDismiss: () => void;
}

export function LoadingFeedback({
  messageKey = 'loading',
  variation = 0,
}: Partial<MessageSelectionProps>) {
  const message = getFeedbackMessage(messageKey, variation);

  return (
    <View
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.loading}
      testID="feedback-loading"
    >
      <AppText tone="muted">{message}</AppText>
      {[0.72, 1, 0.86].map((width, index) => (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          key={width}
          style={[
            styles.skeletonRow,
            { opacity: 1 - index * 0.12, width: `${width * 100}%` },
          ]}
        />
      ))}
    </View>
  );
}

export function ErrorFeedback({
  messageKey = 'load-error',
  onRetry,
  title = 'Não deu para carregar',
  variation = 0,
}: ErrorFeedbackProps) {
  const message = getFeedbackMessage(messageKey, variation);

  return (
    <View style={styles.panel} testID="feedback-error">
      <AppText variant="heading">{title}</AppText>
      <AppText accessibilityRole="alert" tone="muted">
        {message}
      </AppText>
      {onRetry ? (
        <AppButton
          label="Tentar novamente"
          onPress={onRetry}
          style={styles.action}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

export function UnavailableFeedback({
  messageKey = 'content-unavailable',
  title = 'Conteúdo indisponível',
  variation = 0,
}: UnavailableFeedbackProps) {
  return (
    <View style={styles.panel} testID="feedback-unavailable">
      <AppText variant="heading">{title}</AppText>
      <AppText accessibilityRole="alert" tone="muted">
        {getFeedbackMessage(messageKey, variation)}
      </AppText>
    </View>
  );
}

const connectionMessageKeys: Record<ConnectionStatus, FeedbackMessageKey> = {
  'offline-available': 'connection-offline-available',
  required: 'connection-required',
  restored: 'connection-restored',
};

export function ConnectionBanner({
  onRetry,
  status,
  variation = 0,
}: ConnectionBannerProps) {
  const needsConnection = status === 'required';

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.connectionBanner,
        status === 'restored' && styles.connectionRestored,
      ]}
      testID={`connection-${status}`}
    >
      <AppText
        accessibilityRole={needsConnection ? 'alert' : undefined}
        style={styles.connectionCopy}
        variant="caption"
      >
        {getFeedbackMessage(connectionMessageKeys[status], variation)}
      </AppText>
      {needsConnection && onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.bannerAction,
            pressed && styles.pressed,
          ]}
        >
          <AppText tone="accent" variant="caption">
            Tentar novamente
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function TemporaryFeedback({
  actionLabel,
  durationMs = 5_000,
  messageKey,
  onAction,
  onDismiss,
  variation = 0,
}: TemporaryFeedbackProps) {
  useEffect(() => {
    if (durationMs <= 0) return undefined;

    const timeout = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timeout);
  }, [durationMs, onDismiss]);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={styles.temporary}
      testID="temporary-feedback"
    >
      <AppText style={styles.temporaryCopy} tone="inverse">
        {getFeedbackMessage(messageKey, variation)}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <AppText tone="inverse">{actionLabel}</AppText>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityLabel="Fechar mensagem"
        accessibilityRole="button"
        onPress={onDismiss}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <AppText tone="inverse">×</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignSelf: 'center',
    gap: spacing.md,
    maxWidth: layout.contentMaxWidth,
    padding: spacing.xl,
    width: '100%',
  },
  skeletonRow: {
    backgroundColor: colors.line,
    borderRadius: radii.md,
    height: 72,
  },
  panel: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    margin: spacing.xl,
    maxWidth: 560,
    padding: spacing.xl,
    width: '90%',
  },
  action: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  connectionBanner: {
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 40,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  connectionRestored: {
    backgroundColor: colors.cyanSoft,
  },
  connectionCopy: {
    flex: 1,
  },
  bannerAction: {
    minHeight: 36,
    justifyContent: 'center',
  },
  temporary: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.navyRaised,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.md,
    margin: spacing.md,
    maxWidth: 680,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: '90%',
  },
  temporaryCopy: {
    flex: 1,
  },
  pressed: {
    opacity: 0.72,
  },
});
