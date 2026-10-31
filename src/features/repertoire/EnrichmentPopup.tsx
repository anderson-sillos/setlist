import {
  AccessibilityInfo,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  findNodeHandle,
} from 'react-native';
import type { ComponentRef } from 'react';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { ScreenRefreshIndicator } from '@/components/ui/ScreenDataRefresh';
import { OptionSheet } from '@/components/ui/list-controls/OptionSheet';
import type { LrclibFailureReason } from '@/data/lrclib/types';
import type {
  EnrichmentCandidate,
  EnrichmentOperationState,
} from './enrichment/types';
import { formatEnrichmentName } from './enrichment/nameFormatting';
import { formatDuration } from '@/utils/duration';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface EnrichmentPopupProps {
  readonly visible: boolean;
  readonly state: EnrichmentOperationState;
  readonly message: string;
  readonly remainingSeconds: number;
  readonly onClose: () => void;
  readonly onDismiss: () => void;
  readonly onRetry: () => void;
  readonly onSelectCandidate: (candidate: EnrichmentCandidate) => void;
  readonly onChooseDuration: (
    decision:
      | 'use-recording-duration-and-sync'
      | 'keep-current-duration-and-import-static',
  ) => void;
  readonly hasUsableSynchronizedLyrics: (
    candidate: EnrichmentCandidate,
  ) => boolean;
}

const activeStatuses = new Set([
  'preparing',
  'searching',
  'retry-wait',
  'ranking',
  'validating',
  'applying',
]);

function getEnrichmentFailureFeedback(
  reason: LrclibFailureReason,
  httpStatus?: number,
): { readonly message: string; readonly code: string } {
  const code =
    reason === 'timeout'
      ? 'TIMEOUT'
      : reason === 'invalid-response'
        ? `INVALID_RESPONSE${httpStatus ? ` (HTTP ${httpStatus})` : ''}`
        : reason === 'rate-limited'
          ? `RATE_LIMITED${httpStatus ? ` (HTTP ${httpStatus})` : ''}`
          : httpStatus
            ? `HTTP_${httpStatus}`
            : 'NETWORK_ERROR';

  let message: string;
  switch (reason) {
    case 'timeout':
      message = 'A busca fez um solo longo demais: o tempo acabou.';
      break;
    case 'invalid-response':
      message = 'O retorno veio em partitura alienígena: resposta inválida.';
      break;
    case 'rate-limited':
      message = 'A busca pegou fila no camarim: limite temporário.';
      break;
    case 'unavailable':
      if (httpStatus === 502) {
        message =
          'O mensageiro entre servidores se perdeu no backstage: resposta Bad Gateway.';
      } else if (httpStatus) {
        message = 'O serviço desafinou: resposta HTTP indisponível.';
      } else {
        message = 'O cabo da conexão escapou do palco: falha de rede.';
      }
      break;
  }

  return { message, code };
}

function EnrichmentFailureDetails({
  reason,
  httpStatus,
}: {
  readonly reason: LrclibFailureReason;
  readonly httpStatus?: number;
}) {
  const feedback = getEnrichmentFailureFeedback(reason, httpStatus);

  return (
    <View style={styles.failureDetails}>
      <AppText
        testID="song-enrichment-retry-error"
        tone="muted"
        variant="caption"
      >
        {feedback.message}
      </AppText>
      <AppText
        testID="song-enrichment-error-code"
        tone="muted"
        variant="caption"
      >
        Código: {feedback.code}
      </AppText>
    </View>
  );
}

export function EnrichmentPopup({
  visible,
  state,
  message,
  remainingSeconds,
  onClose,
  onDismiss,
  onRetry,
  onSelectCandidate,
  onChooseDuration,
  hasUsableSynchronizedLyrics,
}: EnrichmentPopupProps) {
  const isActive = activeStatuses.has(state.status);
  const cooldownSeconds = state.status === 'failed' ? remainingSeconds : 0;

  return (
    <OptionSheet
      closeAccessibilityLabel="Fechar popup de completar música"
      label={
        state.status === 'completed'
          ? 'Pesquisa concluída'
          : state.status === 'selecting'
            ? 'Escolha a gravação'
            : state.status === 'empty'
              ? 'Nenhum resultado'
              : 'Completar música'
      }
      onClose={onClose}
      onDismiss={onDismiss}
      sheetStyle={styles.sheet}
      testID="song-enrichment-popup"
      visible={visible}
    >
      <View accessibilityLiveRegion="polite" style={styles.content}>
        <AppText testID="song-enrichment-message">{message}</AppText>

        {isActive ? (
          <View style={styles.progress} testID="song-enrichment-progress">
            <ScreenRefreshIndicator />
            {state.status === 'retry-wait' ? (
              <View style={styles.progressDetails}>
                <EnrichmentFailureDetails
                  httpStatus={state.httpStatus}
                  reason={state.reason}
                />
                <AppText
                  testID="song-enrichment-retry-countdown"
                  tone="muted"
                  variant="caption"
                >
                  Tentativa {state.attempt} de {state.total} em{' '}
                  {remainingSeconds} s…
                </AppText>
              </View>
            ) : null}
          </View>
        ) : null}

        {state.status === 'selecting' ? (
          <ScrollView
            contentContainerStyle={styles.candidateList}
            style={styles.candidateScroll}
            testID="song-enrichment-candidates"
          >
            {state.candidates.map((candidate) => {
              const synchronized =
                candidate.instrumental !== true &&
                hasUsableSynchronizedLyrics(candidate);
              const detail = [
                candidate.album || 'Álbum não informado',
                formatDuration(candidate.durationMs),
                candidate.instrumental === true
                  ? 'Instrumental'
                  : synchronized
                    ? 'Letra sincronizada'
                    : 'Letra estática',
              ].join(' · ');
              return (
                <Pressable
                  accessibilityLabel={`${formatEnrichmentName(candidate.title)}, ${formatEnrichmentName(candidate.artist)}, ${detail}`}
                  accessibilityRole="button"
                  key={candidate.recordId}
                  onPress={() => onSelectCandidate(candidate)}
                  style={({ pressed }) => [
                    styles.candidate,
                    pressed && styles.candidatePressed,
                  ]}
                  testID={`song-enrichment-candidate-${candidate.recordId}`}
                >
                  <AppText numberOfLines={1} style={styles.candidateTitle}>
                    {formatEnrichmentName(candidate.title)}
                  </AppText>
                  <AppText numberOfLines={2} tone="muted" variant="caption">
                    {formatEnrichmentName(candidate.artist)} · {detail}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {state.status === 'duration-choice' ? (
          <View style={styles.choiceContent}>
            <AppText>
              A duração informada é {formatDuration(state.currentDurationMs)} e
              a gravação encontrada tem{' '}
              {formatDuration(state.recordingDurationMs)}. Como a diferença
              passa de dois segundos, escolha como importar os tempos.
            </AppText>
            <AppButton
              icon="music"
              label={`Usar ${formatDuration(state.recordingDurationMs)} e sincronizar`}
              onPress={() =>
                onChooseDuration('use-recording-duration-and-sync')
              }
            />
            <AppButton
              icon="timer"
              label={`Manter ${formatDuration(state.currentDurationMs)} e importar texto`}
              onPress={() =>
                onChooseDuration('keep-current-duration-and-import-static')
              }
              variant="secondary"
            />
          </View>
        ) : null}

        {state.status === 'completed' || state.status === 'empty' ? (
          <View style={styles.result}>
            {state.status === 'completed' ? (
              <AppText style={styles.summary} tone="muted" variant="caption">
                {state.summary}
              </AppText>
            ) : null}
            <AppButton
              label="OK"
              onPress={onClose}
              style={styles.resultButton}
              testID="song-enrichment-close"
              variant="primary"
            />
          </View>
        ) : null}

        {state.status === 'failed' ? (
          <View style={styles.retry}>
            <EnrichmentFailureDetails
              httpStatus={state.httpStatus}
              reason={state.reason}
            />
            {cooldownSeconds > 0 ? (
              <AppText tone="muted" variant="caption">
                Nova tentativa disponível em {cooldownSeconds} s.
              </AppText>
            ) : null}
            <AppButton
              disabled={cooldownSeconds > 0}
              icon="renew"
              label={
                cooldownSeconds > 0
                  ? `Tentar novamente em ${cooldownSeconds} s`
                  : 'Tentar novamente'
              }
              onPress={onRetry}
              testID="song-enrichment-retry"
              variant="secondary"
            />
          </View>
        ) : null}
      </View>
    </OptionSheet>
  );
}

export function restoreEnrichmentTriggerFocus(
  trigger: ComponentRef<typeof Pressable> | null,
): void {
  if (!trigger) return;

  if (Platform.OS === 'web') {
    const webTrigger = trigger as ComponentRef<typeof Pressable> & {
      focus?: () => void;
    };
    webTrigger.focus?.();
    return;
  }

  const node = findNodeHandle(trigger);
  if (node !== null) AccessibilityInfo.setAccessibilityFocus(node);
}

const styles = StyleSheet.create({
  sheet: {
    maxHeight: '85%',
    maxWidth: 520,
  },
  content: {
    gap: spacing.lg,
    minHeight: 48,
  },
  progress: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: layout.minimumTouchTarget,
  },
  progressDetails: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  failureDetails: {
    gap: spacing.xs,
  },
  candidateScroll: {
    maxHeight: 360,
  },
  candidateList: {
    gap: spacing.sm,
  },
  candidate: {
    backgroundColor: colors.background.base,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    minHeight: layout.minimumTouchTarget,
    padding: spacing.md,
  },
  candidatePressed: {
    backgroundColor: colors.background.pressed,
  },
  candidateTitle: {
    fontWeight: '600',
  },
  choiceContent: {
    gap: spacing.md,
  },
  summary: {
    lineHeight: 20,
  },
  result: {
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  resultButton: {
    alignSelf: 'center',
  },
  retry: {
    alignItems: 'flex-start',
    gap: spacing.md,
  },
});
