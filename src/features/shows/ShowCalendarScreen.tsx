import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import {
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useBandContext, useShow, useSongSummaries } from '@/data/queries';
import type { EntityId } from '@/domain';
import { getShowDurationBreakdown } from '@/domain/setlistDuration';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import { getShowHref } from '@/features/navigation/routes';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { colors, radii, spacing } from '@/theme/tokens';
import { openNativeCalendarForm } from './export/calendarAction';
import {
  canShareDocumentFile,
  cleanupExpiredDocumentFiles,
  downloadDocumentFile,
  prepareDocumentFile,
  releaseDocumentFile,
  shareDocumentFile,
} from './export/documentDelivery';
import type { PreparedDocumentFile } from './export/documentFileTypes';
import {
  createShowExportFilename,
  encodeUtf8,
} from './export/documentFileTypes';
import {
  createCalendarDraft,
  createShowCalendarIcs,
  getZonedDateTimeFields,
  validateCalendarDraft,
  type CalendarDraft,
} from './export/showCalendarModel';

interface ShowCalendarScreenProps {
  readonly bandId: EntityId;
  readonly showId: EntityId;
}

export function ShowCalendarScreen({
  bandId,
  showId,
}: ShowCalendarScreenProps) {
  const showQuery = useShow(bandId, showId);
  const songsQuery = useSongSummaries(bandId, true);
  const bandQuery = useBandContext(bandId);
  useScreenDataRefresh([showQuery, songsQuery, bandQuery]);
  const songsById = useMemo(
    () => new Map((songsQuery.data ?? []).map((song) => [song.id, song])),
    [songsQuery.data],
  );
  const duration = showQuery.data
    ? getShowDurationBreakdown(showQuery.data, songsById).totalMs
    : null;
  const [draft, setDraft] = useState<CalendarDraft | null>(null);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [file, setFile] = useState<PreparedDocumentFile | null>(null);
  const fileRef = useRef<PreparedDocumentFile | null>(file);
  const draftInitialized = useRef(false);

  useEffect(() => {
    if (
      draftInitialized.current ||
      !showQuery.data ||
      !songsQuery.data ||
      !bandQuery.data?.role ||
      showQuery.isError ||
      songsQuery.isError ||
      bandQuery.isError ||
      showQuery.data.status === 'cancelled'
    ) {
      return;
    }
    draftInitialized.current = true;
    const nextDraft = createCalendarDraft(
      showQuery.data,
      bandQuery.data.bandName,
      duration,
    );
    setDraft(nextDraft);
  }, [
    bandQuery.data,
    bandQuery.isError,
    duration,
    showQuery.data,
    showQuery.isError,
    songsQuery.data,
    songsQuery.isError,
  ]);

  useEffect(() => {
    fileRef.current = file;
  }, [file]);

  useEffect(() => {
    void cleanupExpiredDocumentFiles().catch(() => undefined);
    return () => {
      if (fileRef.current) releaseDocumentFile(fileRef.current);
    };
  }, []);

  const validation = draft
    ? validateCalendarDraft(draft, includeNotes)
    : { valid: false as const, message: 'Carregando os dados do show.' };
  const queryError =
    showQuery.isError || songsQuery.isError || bandQuery.isError;
  const isLoading =
    showQuery.isPending || songsQuery.isPending || bandQuery.isPending;
  const canPrepare =
    !queryError &&
    Boolean(showQuery.data && songsQuery.data && bandQuery.data?.role);
  const accessConfirmedLost =
    (bandQuery.isSuccess && !bandQuery.data?.role) ||
    (showQuery.isSuccess && !showQuery.data);
  const showCancelled =
    showQuery.isSuccess && showQuery.data?.status === 'cancelled';
  const canShowDraft = Boolean(draft && !accessConfirmedLost && !showCancelled);
  const canDeliver = canShowDraft && canPrepare && !isLoading && !working;

  const createIcsFile = async () => {
    if (!draft || !validation.valid || working) return;
    setWorking(true);
    setError(null);
    setMessage(null);
    try {
      const content = await createShowCalendarIcs(draft, validation.event);
      const dateKey = getZonedDateTimeFields(draft.startsAt).date;
      const fileName = createShowExportFilename(
        draft.title,
        dateKey || 'show',
        'ics',
      );
      const nextFile = await prepareDocumentFile(
        fileName,
        'text/calendar;charset=utf-8',
        encodeUtf8(content),
      );
      if (file) releaseDocumentFile(file);
      fileRef.current = nextFile;
      setFile(nextFile);
      if (Platform.OS === 'web') {
        let shareFailed = false;
        try {
          if (await canShareDocumentFile(nextFile)) {
            const result = await shareDocumentFile(nextFile);
            if (result.status === 'opened') {
              setMessage(
                'O seletor de compartilhamento foi aberto. O Setlist não consegue confirmar o recebimento pelo destino escolhido.',
              );
              return;
            }
            if (result.status === 'cancelled') {
              setMessage(
                'Compartilhamento cancelado. Você pode tentar compartilhar novamente.',
              );
              return;
            }
          }
        } catch {
          // A ativação do navegador pode expirar durante a geração do arquivo.
          shareFailed = true;
        }
        const result = await downloadDocumentFile(nextFile);
        if (result.status !== 'opened') {
          throw new Error(
            'O navegador não iniciou o download do arquivo .ics.',
          );
        }
        setMessage(
          shareFailed
            ? 'O navegador não abriu o seletor automaticamente; o download do arquivo .ics foi iniciado.'
            : 'O compartilhamento não está disponível neste navegador; o download do arquivo .ics foi iniciado.',
        );
        return;
      }

      const result = await shareDocumentFile(nextFile);
      if (result.status === 'unsupported') {
        setMessage(
          'O seletor do sistema não está disponível. Tente novamente para gerar e compartilhar o arquivo .ics.',
        );
      } else if (result.status === 'cancelled') {
        setMessage(
          'Compartilhamento cancelado. Você pode tentar compartilhar novamente.',
        );
      } else {
        setMessage(
          'O seletor foi aberto. O Setlist não consegue confirmar o recebimento pelo destino escolhido.',
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível gerar o arquivo .ics.',
      );
    } finally {
      setWorking(false);
    }
  };

  const toggleNotes = () => {
    setIncludeNotes((value) => !value);
    setMessage(null);
    if (file) {
      releaseDocumentFile(file);
      fileRef.current = null;
      setFile(null);
    }
  };

  const openCalendar = async () => {
    if (!validation.valid || working) return;
    setWorking(true);
    setError(null);
    setMessage(null);
    try {
      const result = await openNativeCalendarForm(validation.event);
      if (result.status === 'unsupported') {
        setMessage(
          'O formulário nativo não está disponível. Gere um arquivo .ics para importar ou compartilhar.',
        );
      } else if (result.status === 'saved') {
        setMessage(
          'O calendário confirmou que o evento foi salvo. Esta é uma cópia pontual.',
        );
      } else if (result.status === 'cancelled') {
        setMessage('Criação cancelada. Nenhuma outra cópia foi criada.');
      } else {
        setMessage(
          'O formulário do calendário foi aberto e retornou. Confira se o evento foi salvo; o sistema não confirmou esse resultado.',
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível abrir o formulário do calendário.',
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <BandAreaLayout
      activeSection="shows"
      backHref={getShowHref(bandId, showId)}
      bandId={bandId}
      currentRoute={`${getShowHref(bandId, showId)}/calendar`}
      screenKind="detail"
      title="Adicionar ao calendário"
    >
      {isLoading ? <LoadingFeedback variation={1} /> : null}
      {showQuery.isError || songsQuery.isError || bandQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void Promise.all([
              showQuery.refetch(),
              songsQuery.refetch(),
              bandQuery.refetch(),
            ]);
          }}
        />
      ) : null}
      {showQuery.isSuccess && !showQuery.data ? (
        <UnavailableFeedback title="Show indisponível" />
      ) : null}
      {bandQuery.isSuccess && !bandQuery.data?.role ? (
        <UnavailableFeedback title="Acesso à banda indisponível" />
      ) : null}
      {showCancelled ? (
        <View style={styles.content}>
          <UnavailableFeedback title="Show cancelado" />
          <AppText accessibilityRole="alert" tone="muted">
            Um show Cancelado não pode ser adicionado como novo evento ativo.
          </AppText>
        </View>
      ) : null}
      {canShowDraft && draft ? (
        <View style={styles.content}>
          <AppText>
            Revise os dados e confirme a cópia no calendário. Ela não será
            sincronizada com alterações futuras no Setlist.
          </AppText>
          <Card style={styles.summary}>
            <AppText accessibilityRole="header" variant="heading">
              {draft.title}
            </AppText>
            <AppText tone="muted">Início: {draft.startLabel}</AppText>
            <AppText tone="muted">Término estimado: {draft.endLabel}</AppText>
            <AppText tone="muted">Fuso: {draft.timeZone}</AppText>
            <AppText>Local: {draft.venue || 'Não informado'}</AppText>
            <AppText>Status no Setlist: {draft.statusLabel}</AppText>
          </Card>

          <Card style={styles.form}>
            <AppText variant="heading">Horário estimado</AppText>
            {draft.usesDefaultDurationEstimate ? (
              <AppText tone="warning" variant="caption">
                Como o setlist não tem durações positivas cadastradas, usamos
                uma estimativa padrão de 2 horas. Você pode ajustar o término no
                aplicativo de calendário.
              </AppText>
            ) : (
              <AppText tone="muted" variant="caption">
                A estimativa usa as durações cadastradas no setlist e pode
                diferir do término real. Ajuste-a no aplicativo de calendário,
                se necessário.
              </AppText>
            )}
            <AppText tone="muted" variant="caption">
              A estimativa usa o fuso {draft.timeZone} e não altera o show
              salvo.
            </AppText>
          </Card>

          {draft.showNotes?.trim() ? (
            <Pressable
              accessibilityLabel="Incluir observações gerais do show"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: includeNotes, disabled: working }}
              disabled={working}
              onPress={toggleNotes}
              style={styles.notesToggle}
            >
              <View style={[styles.checkbox, includeNotes && styles.checked]}>
                {includeNotes ? <AppText tone="onAccent">✓</AppText> : null}
              </View>
              <AppText>Incluir observações gerais do show</AppText>
            </Pressable>
          ) : null}

          <AppText tone="muted" variant="caption">
            A descrição pode incluir banda, status, fuso, o horário estimado de
            término e as observações gerais que você selecionar. A setlist,
            letras e dados de integrantes ficam fora da cópia.
          </AppText>
          <AppText tone="warning" variant="caption">
            Adicionar o mesmo show novamente pode criar uma duplicata no
            calendário.
          </AppText>

          <View style={styles.actionGroup}>
            {Platform.OS !== 'web' ? (
              <AppButton
                disabled={!validation.valid || !canDeliver}
                icon="showAdd"
                label={
                  working ? 'Abrindo calendário…' : 'Adicionar ao calendário'
                }
                onPress={() => void openCalendar()}
                style={styles.actionButton}
              />
            ) : null}
            <AppButton
              disabled={!validation.valid || !canDeliver}
              icon="share"
              label={working ? 'Preparando…' : 'Compartilhar'}
              onPress={() => void createIcsFile()}
              style={styles.actionButton}
              variant={Platform.OS === 'web' ? 'primary' : 'secondary'}
            />
          </View>
          {message ? (
            <AppText accessibilityLiveRegion="polite" tone="success">
              {message}
            </AppText>
          ) : null}
          {error ? (
            <AppText accessibilityRole="alert" tone="danger">
              {error}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </BandAreaLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  summary: {
    gap: spacing.xs,
  },
  form: {
    gap: spacing.sm,
  },
  actionGroup: {
    alignSelf: 'center',
    gap: spacing.sm,
    maxWidth: 480,
    width: '100%',
  },
  actionButton: {
    width: '100%',
  },
  notesToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.border.control,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checked: {
    backgroundColor: colors.action.primary,
    borderColor: colors.action.primary,
  },
});
