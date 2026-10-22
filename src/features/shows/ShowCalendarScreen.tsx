import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const showQuery = useShow(bandId, showId);
  const songsQuery = useSongSummaries(bandId, true);
  const bandQuery = useBandContext(bandId);
  const songsById = useMemo(
    () => new Map((songsQuery.data ?? []).map((song) => [song.id, song])),
    [songsQuery.data],
  );
  const duration = showQuery.data
    ? getShowDurationBreakdown(showQuery.data, songsById).totalMs
    : null;
  const [draft, setDraft] = useState<CalendarDraft | null>(null);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [includeNotes, setIncludeNotes] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [file, setFile] = useState<PreparedDocumentFile | null>(null);
  const [shareAvailability, setShareAvailability] = useState<{
    readonly uri: string;
    readonly available: boolean;
  } | null>(null);
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
    setEndDate(nextDraft.endDate);
    setEndTime(nextDraft.endTime);
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
    let active = true;
    if (!file) return;
    void canShareDocumentFile(file)
      .then((available) => {
        if (active) setShareAvailability({ uri: file.uri, available });
      })
      .catch(() => {
        if (active) setShareAvailability({ uri: file.uri, available: false });
      });
    return () => {
      active = false;
    };
  }, [file]);

  useEffect(() => {
    void cleanupExpiredDocumentFiles().catch(() => undefined);
    return () => {
      if (fileRef.current) releaseDocumentFile(fileRef.current);
    };
  }, []);

  const validation = draft
    ? validateCalendarDraft(draft, endDate, endTime, includeNotes)
    : { valid: false as const, message: 'Carregando os dados do show.' };
  const shareSupported = Boolean(
    file && shareAvailability?.uri === file.uri && shareAvailability.available,
  );
  const isLoading =
    showQuery.isPending || songsQuery.isPending || bandQuery.isPending;
  const canPrepare =
    !isLoading &&
    !showQuery.isError &&
    !songsQuery.isError &&
    !bandQuery.isError &&
    Boolean(showQuery.data && songsQuery.data && bandQuery.data?.role);

  const updateEndField = (field: 'date' | 'time', value: string) => {
    if (field === 'date') setEndDate(value);
    else setEndTime(value);
    setError(null);
    setMessage(null);
    if (file) {
      releaseDocumentFile(file);
      setFile(null);
    }
  };

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
      setFile(nextFile);
      setMessage(
        `Arquivo preparado: ${nextFile.name}. Confirme o download ou compartilhamento.`,
      );
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

  const deliverIcsFile = async (action: 'download' | 'share') => {
    if (!file || working) return;
    setWorking(true);
    setError(null);
    setMessage(null);
    try {
      const result =
        action === 'share'
          ? await shareDocumentFile(file)
          : await downloadDocumentFile(file);
      if (result.status === 'unsupported') {
        setMessage(
          'Compartilhamento indisponível. O arquivo .ics continua preparado para download.',
        );
      } else if (result.status === 'cancelled') {
        setMessage(
          'Compartilhamento cancelado. O arquivo .ics continua preparado.',
        );
      } else {
        setMessage(
          action === 'download'
            ? Platform.OS === 'web'
              ? 'Download do arquivo de calendário iniciado.'
              : 'O seletor do sistema foi aberto para salvar ou compartilhar o arquivo.'
            : 'O seletor foi aberto. O Setlist não consegue confirmar o recebimento pelo destino escolhido.',
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível entregar o arquivo .ics.',
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
            void queryClient.invalidateQueries({ queryKey: ['bands', bandId] });
          }}
        />
      ) : null}
      {canPrepare && !showQuery.data ? (
        <UnavailableFeedback title="Show indisponível" />
      ) : null}
      {canPrepare && !bandQuery.data?.role ? (
        <UnavailableFeedback title="Acesso à banda indisponível" />
      ) : null}
      {showQuery.data?.status === 'cancelled' ? (
        <View style={styles.content}>
          <UnavailableFeedback title="Show cancelado" />
          <AppText accessibilityRole="alert" tone="muted">
            Um show Cancelado não pode ser adicionado como novo evento ativo.
          </AppText>
        </View>
      ) : null}
      {canPrepare && showQuery.data?.status !== 'cancelled' && draft ? (
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
            <AppText tone="muted">Fuso: {draft.timeZone}</AppText>
            <AppText>Local: {draft.venue || 'Não informado'}</AppText>
            <AppText>Status no Setlist: {draft.statusLabel}</AppText>
          </Card>

          <Card style={styles.form}>
            <AppText variant="heading">Término do evento</AppText>
            {draft.suggestedEnd ? (
              <AppText tone="muted" variant="caption">
                Sugerido pela duração estimada do setlist. Você pode ajustar
                antes de confirmar.
              </AppText>
            ) : (
              <AppText tone="warning" variant="caption">
                A duração não permite sugerir um término. Informe a data e o
                horário para continuar.
              </AppText>
            )}
            <CalendarTextField
              accessibilityLabel="Data de término no formato ano, mês e dia"
              label="Data (AAAA-MM-DD)"
              onChangeText={(value) => updateEndField('date', value)}
              placeholder="2026-10-22"
              value={endDate}
            />
            <CalendarTextField
              accessibilityLabel="Horário de término no formato horas e minutos"
              label="Horário (HH:MM)"
              onChangeText={(value) => updateEndField('time', value)}
              placeholder="23:30"
              value={endTime}
            />
            <AppText tone="muted" variant="caption">
              O término é interpretado em {draft.timeZone}. Ele não altera o
              show salvo.
            </AppText>
            {validation.valid ? null : (
              <AppText accessibilityRole="alert" tone="danger">
                {validation.message}
              </AppText>
            )}
          </Card>

          {draft.showNotes?.trim() ? (
            <Pressable
              accessibilityLabel="Incluir observações gerais do show"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: includeNotes }}
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
            A descrição pode incluir apenas banda, estado, fuso e as observações
            gerais que você selecionar. A setlist, letras e dados de integrantes
            ficam fora da cópia.
          </AppText>
          <AppText tone="warning" variant="caption">
            Adicionar o mesmo show novamente pode criar uma duplicata no
            calendário.
          </AppText>

          {Platform.OS !== 'web' ? (
            <AppButton
              disabled={!validation.valid || working}
              label={
                working
                  ? 'Abrindo calendário…'
                  : 'Abrir formulário do calendário'
              }
              onPress={() => void openCalendar()}
            />
          ) : null}
          <AppButton
            disabled={!validation.valid || working}
            label={working ? 'Preparando arquivo…' : 'Preparar arquivo .ics'}
            onPress={() => void createIcsFile()}
            variant={Platform.OS === 'web' ? 'primary' : 'secondary'}
          />
          {file ? (
            <View style={styles.fileActions}>
              <AppText tone="muted" variant="caption">
                Arquivo pronto: {file.name}
              </AppText>
              <AppButton
                disabled={working}
                label={
                  Platform.OS === 'web'
                    ? 'Baixar arquivo .ics'
                    : 'Abrir seletor para salvar ou compartilhar .ics'
                }
                onPress={() => void deliverIcsFile('download')}
                variant="secondary"
              />
              {Platform.OS === 'web' && shareSupported ? (
                <AppButton
                  disabled={working}
                  label="Compartilhar arquivo .ics"
                  onPress={() => void deliverIcsFile('share')}
                  variant="secondary"
                />
              ) : null}
            </View>
          ) : null}
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

function CalendarTextField({
  accessibilityLabel,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  readonly accessibilityLabel: string;
  readonly label: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder: string;
  readonly value: string;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="caption">{label}</AppText>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        style={styles.input}
        value={value}
      />
    </View>
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
  fileActions: {
    gap: spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.control,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text.primary,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md,
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
