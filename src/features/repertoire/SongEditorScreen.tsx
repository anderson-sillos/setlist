import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  ActionNotice,
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { UnsavedChangesPrompt } from '@/components/feedback/UnsavedChangesPrompt';
import { AutocompleteField } from '@/components/ui/AutocompleteField';
import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { KeyboardDismissRegion } from '@/components/ui/KeyboardDismissRegion';
import { SpinButton } from '@/components/ui/SpinButton';
import { acceptCurrentBandTerm } from '@/data/supabase/legalTermMutations';
import {
  createSong,
  SongMutationError,
  updateSong,
} from '@/data/supabase/songMutations';
import {
  archiveSong,
  removeSong,
  restoreSong,
  SongLifecycleMutationError,
} from '@/data/supabase/songLifecycleMutations';
import {
  useCurrentBandTermAcceptance,
  useSong,
  useBandContext,
  useSongSummaries,
} from '@/data/queries';
import { invalidateBandReadData } from '@/data/queryInvalidations';
import {
  LrclibRequestCancelledError,
  LrclibRequestError,
  searchLrclibTracks,
} from '@/data/lrclib/client';
import type { LrclibTrack } from '@/data/lrclib/types';
import type { EntityId, LyricDocument } from '@/domain';
import { BandTermAcceptanceDialog } from '@/features/bands/BandTermAcceptanceDialog';
import { CURRENT_BAND_TERM } from '@/features/bands/legalTerm';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  getBandSectionHref,
  getSongCreateHref,
  getSongEditHref,
  getSongHref,
} from '@/features/navigation/routes';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { LyricDocumentEditor } from './LyricDocumentEditor';
import { SongLifecycleDialog } from './SongLifecycleDialog';
import {
  EnrichmentPopup,
  restoreEnrichmentTriggerFocus,
} from './EnrichmentPopup';
import { applyEnrichmentToDraft } from './enrichment/application';
import { convertEnrichmentLyrics } from './enrichment/lyrics';
import { rankEnrichmentCandidates } from './enrichment/matching';
import {
  planCandidateSelection,
  planLyricsImport,
} from './enrichment/selection';
import {
  chooseEnrichmentFeedback,
  type EnrichmentFeedbackStage,
} from './enrichment/feedback';
import type {
  EnrichmentCandidate,
  EnrichmentOperationState,
} from './enrichment/types';
import {
  durationFromEditorParts,
  durationToParts,
  emptySongEditorValues,
  parseDurationInput,
  parseSongEditorValues,
  songToEditorValues,
  type DurationParts,
  type SongEditorErrors,
  type SongEditorField,
  type SongEditorValues,
} from './songEditorForm';

interface SongEditorScreenProps {
  readonly bandId: EntityId;
  readonly songId?: EntityId;
}

const emptyLyricDocument: LyricDocument = { blocks: [] };

function toEnrichmentCandidate(track: LrclibTrack): EnrichmentCandidate {
  return {
    recordId: track.recordId,
    title: track.trackName,
    artist: track.artistName,
    album: track.albumName,
    durationMs: track.durationMs,
    plainLyrics: track.plainLyrics,
    syncedLyrics: track.syncedLyrics,
    instrumental: track.instrumental,
  };
}

function hasLyricText(document: LyricDocument): boolean {
  return document.blocks.some((block) =>
    block.lines.some((line) => line.text.trim().length > 0),
  );
}

function getConvertedCandidateLyrics(candidate: EnrichmentCandidate) {
  return convertEnrichmentLyrics(
    {
      plainLyrics: candidate.plainLyrics,
      recordingDurationMs: candidate.durationMs,
      syncedLyrics: candidate.syncedLyrics,
    },
    () => `candidate-${candidate.recordId}`,
  );
}

export function SongEditorScreen({ bandId, songId }: SongEditorScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const bandContextQuery = useBandContext(bandId);
  const bandSongSummariesQuery = useSongSummaries(bandId, true);
  const songQuery = useSong(bandId, songId ?? '', Boolean(songId));
  const hasSongLoadError = Boolean(songId) && songQuery.isError;
  const [isAcceptingTerm, setIsAcceptingTerm] = useState(false);
  const [termAcceptanceError, setTermAcceptanceError] = useState<string | null>(
    null,
  );
  const [editedValues, setEditedValues] = useState<{
    readonly songId: EntityId | null;
    readonly values: SongEditorValues;
  } | null>(null);
  const [editedLyrics, setEditedLyrics] = useState<{
    readonly songId: EntityId | null;
    readonly document: LyricDocument;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SongEditorErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const [lifecycleDialogVisible, setLifecycleDialogVisible] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [lifecycleNotice, setLifecycleNotice] = useState<string | null>(null);
  const [lifecycleNoticeTitle, setLifecycleNoticeTitle] = useState<
    string | null
  >(null);
  const [lifecycleSubmitting, setLifecycleSubmitting] = useState(false);
  const [enrichmentState, setEnrichmentState] =
    useState<EnrichmentOperationState>({ status: 'idle' });
  const [enrichmentMessage, setEnrichmentMessage] = useState('');
  const [enrichmentClockNow, setEnrichmentClockNow] = useState(() =>
    Date.now(),
  );
  const enrichmentTrigger = useRef<ComponentRef<typeof Pressable>>(null);
  const enrichmentController = useRef<AbortController | null>(null);
  const enrichmentSequence = useRef(0);
  const nextAllowedEnrichmentSearchAt = useRef<number | null>(null);
  const previousFeedback = useRef<
    Partial<Record<EnrichmentFeedbackStage, string>>
  >({});
  const song = songQuery.data;
  const membership = bandContextQuery.data;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';
  const termAcceptanceQuery = useCurrentBandTermAcceptance(
    bandId,
    CURRENT_BAND_TERM.version,
    canEdit,
  );
  useScreenDataRefresh([
    bandContextQuery,
    bandSongSummariesQuery,
    songQuery,
    termAcceptanceQuery,
  ]);
  const isLoading =
    bandContextQuery.isPending ||
    (Boolean(songId) && songQuery.isPending) ||
    (canEdit && termAcceptanceQuery.isPending);
  const originalArtistOptions = Array.from(
    new Set(
      bandSongSummariesQuery.data
        ?.map(({ originalArtist }) => originalArtist?.trim() ?? '')
        .filter(Boolean) ?? [],
    ),
  );
  const title = songId ? 'Editar música' : 'Nova música';
  const values =
    editedValues?.songId === (songId ?? null)
      ? editedValues.values
      : song
        ? songToEditorValues(song)
        : emptySongEditorValues;
  const lyrics =
    editedLyrics?.songId === (songId ?? null)
      ? editedLyrics.document
      : (song?.lyrics ?? emptyLyricDocument);
  const currentDraft = useRef({ values, lyrics });
  useLayoutEffect(() => {
    currentDraft.current = { values, lyrics };
  }, [lyrics, values]);
  const initialValues = song ? songToEditorValues(song) : emptySongEditorValues;
  const initialLyrics = song?.lyrics ?? emptyLyricDocument;
  const dirty =
    JSON.stringify(values) !== JSON.stringify(initialValues) ||
    JSON.stringify(lyrics) !== JSON.stringify(initialLyrics);
  const unsavedChanges = useUnsavedChangesGuard({
    dirty,
    saving: isSubmitting,
  });

  const setEnrichmentStatus = (
    nextState: EnrichmentOperationState,
    stage?: EnrichmentFeedbackStage,
  ) => {
    if (nextState.status === 'idle') {
      setEnrichmentState(nextState);
      setEnrichmentMessage('');
      return;
    }

    const defaultStage: EnrichmentFeedbackStage = nextState.status;
    const feedbackStage = stage ?? defaultStage;
    const message = chooseEnrichmentFeedback(
      feedbackStage,
      previousFeedback.current[feedbackStage],
    );
    previousFeedback.current[feedbackStage] = message;
    setEnrichmentMessage(message);
    setEnrichmentState(nextState);
  };

  const cancelEnrichment = () => {
    enrichmentSequence.current += 1;
    enrichmentController.current?.abort();
    enrichmentController.current = null;
    setEnrichmentStatus({ status: 'idle' });
  };

  const retryDeadline =
    enrichmentState.status === 'retry-wait'
      ? enrichmentState.retryAt
      : enrichmentState.status === 'failed'
        ? enrichmentState.retryAt
        : undefined;

  useEffect(() => {
    if (!retryDeadline || retryDeadline <= Date.now()) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setEnrichmentClockNow(now);
      if (now >= retryDeadline) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [retryDeadline]);

  useEffect(
    () => () => {
      enrichmentSequence.current += 1;
      enrichmentController.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!canEdit || termAcceptanceQuery.data !== true) {
      enrichmentSequence.current += 1;
      enrichmentController.current?.abort();
      enrichmentController.current = null;
      if (enrichmentState.status !== 'idle') {
        // A permission or term change is an external event; close any stale popup.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEnrichmentState({ status: 'idle' });
        setEnrichmentMessage('');
      }
    }
  }, [
    bandId,
    canEdit,
    enrichmentState.status,
    songId,
    termAcceptanceQuery.data,
  ]);

  const operationIsActive =
    enrichmentState.status === 'preparing' ||
    enrichmentState.status === 'searching' ||
    enrichmentState.status === 'retry-wait' ||
    enrichmentState.status === 'ranking' ||
    enrichmentState.status === 'validating' ||
    enrichmentState.status === 'applying';

  const popupVisible = enrichmentState.status !== 'idle';
  const retryRemainingSeconds =
    (enrichmentState.status === 'retry-wait' ||
      enrichmentState.status === 'failed') &&
    enrichmentState.retryAt
      ? Math.max(
          0,
          Math.ceil((enrichmentState.retryAt - enrichmentClockNow) / 1_000),
        )
      : 0;

  const setField = (field: SongEditorField, value: string) => {
    if (
      (field === 'title' ||
        field === 'originalArtist' ||
        field === 'duration') &&
      enrichmentState.status !== 'idle'
    ) {
      cancelEnrichment();
    }
    const nextValues = { ...values, [field]: value };
    currentDraft.current = { ...currentDraft.current, values: nextValues };
    setEditedValues({
      songId: songId ?? null,
      values: nextValues,
    });
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const applyCandidate = (
    candidate: EnrichmentCandidate,
    durationDecision?:
      | 'use-recording-duration-and-sync'
      | 'keep-current-duration-and-import-static',
  ) => {
    const draft = currentDraft.current;
    setEnrichmentStatus({ status: 'validating' });
    const result = applyEnrichmentToDraft({
      candidate,
      currentValues: draft.values,
      currentLyrics: draft.lyrics,
      convertedLyrics: convertEnrichmentLyrics({
        plainLyrics: candidate.plainLyrics,
        recordingDurationMs: candidate.durationMs,
        syncedLyrics: candidate.syncedLyrics,
      }),
      importedAt: new Date().toISOString(),
      ...(durationDecision ? { durationDecision } : {}),
    });

    if (result.kind === 'duration-choice-required') {
      setEnrichmentStatus(
        {
          status: 'duration-choice',
          candidate,
          currentDurationMs: result.currentDurationMs,
          recordingDurationMs: result.recordingDurationMs,
        },
        'duration-choice',
      );
      return;
    }

    setEnrichmentStatus({ status: 'applying' });
    if (result.kind === 'nothing-to-fill') {
      setEnrichmentStatus(
        {
          status: 'completed',
          summary:
            'Os campos que poderiam ser completados já estão preenchidos.',
        },
        'completed',
      );
      return;
    }

    currentDraft.current = {
      values: result.values,
      lyrics: result.lyrics,
    };
    setEditedValues({ songId: songId ?? null, values: result.values });
    setEditedLyrics({ songId: songId ?? null, document: result.lyrics });

    const fieldLabels = result.changedFields.map((field) =>
      field === 'title'
        ? 'título'
        : field === 'artist'
          ? 'artista'
          : field === 'duration'
            ? 'duração'
            : 'letra',
    );
    const changes =
      fieldLabels.length > 1
        ? `${fieldLabels.slice(0, -1).join(', ')} e ${fieldLabels.at(-1)}`
        : (fieldLabels[0] ?? 'nenhum campo');
    const lyricDescription =
      result.lyricFormat === 'instrumental'
        ? ' A música foi marcada como instrumental, sem letra cantada.'
        : result.lyricFormat === 'lrc'
          ? ' A letra foi marcada como sincronizada.'
          : result.lyricFormat === 'plain'
            ? ' A letra foi importada como texto, sem tempos.'
            : candidate.plainLyrics || candidate.syncedLyrics
              ? ''
              : ' A gravação não trouxe letra.';

    setEnrichmentStatus(
      {
        status: 'completed',
        summary: `Preenchidos: ${changes}.${lyricDescription}`,
      },
      'completed',
    );
  };

  const selectCandidate = (candidate: EnrichmentCandidate) => {
    applyCandidate(candidate);
  };

  const chooseDuration = (
    decision:
      | 'use-recording-duration-and-sync'
      | 'keep-current-duration-and-import-static',
  ) => {
    if (enrichmentState.status !== 'duration-choice') return;
    applyCandidate(enrichmentState.candidate, decision);
  };

  const startEnrichmentSearch = () => {
    const draft = currentDraft.current;
    const queryTitle = draft.values.title.trim();
    if (!queryTitle || isSubmitting || !canEdit) return;

    const retryAt = nextAllowedEnrichmentSearchAt.current;
    if (retryAt && retryAt > Date.now()) {
      setEnrichmentClockNow(Date.now());
      setEnrichmentStatus(
        { status: 'failed', reason: 'rate-limited', retryAt },
        'failed',
      );
      return;
    }
    nextAllowedEnrichmentSearchAt.current = null;

    enrichmentController.current?.abort();
    const controller = new AbortController();
    const operationId = ++enrichmentSequence.current;
    enrichmentController.current = controller;
    setEnrichmentStatus({ status: 'preparing' });

    void (async () => {
      try {
        const tracks = await searchLrclibTracks(
          {
            title: queryTitle,
            artist: draft.values.originalArtist,
          },
          {
            signal: controller.signal,
            onAttempt: (attempt, total) => {
              if (operationId !== enrichmentSequence.current) return;
              setEnrichmentStatus({
                status: 'searching',
                attempt,
                total,
              });
            },
            onRetryWait: ({ nextAttempt, totalAttempts, retryAt }) => {
              if (operationId !== enrichmentSequence.current) return;
              setEnrichmentClockNow(Date.now());
              setEnrichmentStatus(
                {
                  status: 'retry-wait',
                  attempt: nextAttempt,
                  total: totalAttempts,
                  retryAt,
                },
                'retry-wait',
              );
            },
          },
        );
        if (
          controller.signal.aborted ||
          operationId !== enrichmentSequence.current
        ) {
          return;
        }

        enrichmentController.current = null;
        setEnrichmentStatus({ status: 'ranking' });
        const candidates = tracks.map(toEnrichmentCandidate);
        const rankedGroups = rankEnrichmentCandidates(
          candidates,
          {
            title: draft.values.title,
            artist: draft.values.originalArtist,
            durationMs: parseDurationInput(draft.values.duration) ?? null,
          },
          (candidate) =>
            candidate.instrumental !== true &&
            getConvertedCandidateLyrics(candidate).synchronizedDocument !==
              null,
        );
        if (rankedGroups.length === 0) {
          setEnrichmentStatus({ status: 'empty' }, 'empty');
          return;
        }

        const current = currentDraft.current;
        const currentDurationMs = current.values.duration.trim()
          ? parseDurationInput(current.values.duration)
          : null;
        const plan = planCandidateSelection(
          rankedGroups,
          {
            title: current.values.title,
            artist: current.values.originalArtist,
            durationMs: currentDurationMs ?? null,
            hasExistingLyrics:
              hasLyricText(current.lyrics) ||
              current.lyrics.isInstrumental === true,
          },
          (candidate) => {
            const usableLyrics =
              candidate.instrumental !== true &&
              getConvertedCandidateLyrics(candidate).synchronizedDocument !==
                null;
            return (
              planLyricsImport(
                currentDurationMs,
                candidate.durationMs,
                hasLyricText(current.lyrics) ||
                  current.lyrics.isInstrumental === true,
                usableLyrics,
              ).kind === 'choose-duration'
            );
          },
        );

        if (plan.kind === 'empty') {
          setEnrichmentStatus({ status: 'empty' }, 'empty');
        } else if (plan.kind === 'apply') {
          applyCandidate(plan.candidate);
        } else {
          setEnrichmentStatus(
            {
              status: 'selecting',
              candidates: plan.groups.map(({ candidate }) => candidate),
            },
            'selecting',
          );
        }
      } catch (error) {
        if (
          controller.signal.aborted ||
          operationId !== enrichmentSequence.current ||
          error instanceof LrclibRequestCancelledError
        ) {
          return;
        }

        enrichmentController.current = null;
        const reason =
          error instanceof LrclibRequestError ? error.reason : 'unavailable';
        const retryAt =
          error instanceof LrclibRequestError &&
          error.retryAfterMs !== undefined &&
          error.retryAfterMs > 0
            ? Date.now() + error.retryAfterMs
            : undefined;
        if (retryAt) nextAllowedEnrichmentSearchAt.current = retryAt;
        setEnrichmentClockNow(Date.now());
        setEnrichmentStatus(
          {
            status: 'failed',
            reason,
            ...(retryAt ? { retryAt } : {}),
          },
          'failed',
        );
      }
    })();
  };

  const leaveEditor = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(
      songId
        ? getSongHref(bandId, songId)
        : getBandSectionHref(bandId, 'repertoire'),
    );
  };

  const closeLifecycleDialog = () => {
    if (lifecycleSubmitting) {
      return;
    }

    setLifecycleDialogVisible(false);
    setLifecycleError(null);
  };

  const openLifecycleOptions = () => {
    if (!songId || !song) {
      return;
    }

    setLifecycleError(null);
    setLifecycleDialogVisible(true);
  };

  const handleLifecycleError = (error: unknown) => {
    setLifecycleError(
      error instanceof SongLifecycleMutationError
        ? error.message
        : 'Não foi possível atualizar a música agora. Tente novamente.',
    );
  };

  const handleArchive = async () => {
    if (!song) {
      return;
    }

    setLifecycleError(null);
    setLifecycleSubmitting(true);
    try {
      await archiveSong({ bandId, songId: song.id });
      await invalidateBandReadData(queryClient, {
        type: 'song-lifecycle',
        bandId,
      });
      setLifecycleNoticeTitle('Música arquivada');
      setLifecycleNotice(
        'Ela não aparecerá em novas setlists, mas os shows existentes continuam intactos.',
      );
      setLifecycleDialogVisible(false);
    } catch (error) {
      handleLifecycleError(error);
    } finally {
      setLifecycleSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!song) {
      return;
    }

    setLifecycleError(null);
    setLifecycleSubmitting(true);
    try {
      await restoreSong({ bandId, songId: song.id });
      await invalidateBandReadData(queryClient, {
        type: 'song-lifecycle',
        bandId,
      });
      setLifecycleNoticeTitle('Música restaurada');
      setLifecycleNotice('Disponível novamente para novas setlists.');
      setLifecycleDialogVisible(false);
    } catch (error) {
      handleLifecycleError(error);
    } finally {
      setLifecycleSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!song) {
      return;
    }

    setLifecycleError(null);
    setLifecycleSubmitting(true);
    try {
      const result = await removeSong({ bandId, songId: song.id });
      await invalidateBandReadData(queryClient, {
        type: 'song-lifecycle',
        bandId,
      });
      if (result === 'deleted') {
        router.replace(getBandSectionHref(bandId, 'repertoire'));
        return;
      }

      setLifecycleNoticeTitle('Música arquivada');
      setLifecycleNotice(
        'Ela está em um show existente, então foi arquivada para preservar a setlist.',
      );
      setLifecycleDialogVisible(false);
    } catch (error) {
      handleLifecycleError(error);
    } finally {
      setLifecycleSubmitting(false);
    }
  };

  const handleTermAcceptance = async () => {
    setIsAcceptingTerm(true);
    setTermAcceptanceError(null);

    try {
      await acceptCurrentBandTerm({
        bandId,
        termVersion: CURRENT_BAND_TERM.version,
      });
      await termAcceptanceQuery.refetch();
    } catch (error) {
      setTermAcceptanceError(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar seu aceite agora. Tente novamente.',
      );
    } finally {
      setIsAcceptingTerm(false);
    }
  };

  const handleSave = async () => {
    if (submissionLock.current || popupVisible || operationIsActive) return;
    const parsed = parseSongEditorValues(values);
    setFieldErrors(parsed.errors);
    setSubmitError(null);

    if (!parsed.song) {
      return;
    }

    submissionLock.current = true;
    setIsSubmitting(true);

    try {
      if (songId) {
        await updateSong({ bandId, lyrics, song: parsed.song, songId });
        await invalidateBandReadData(queryClient, {
          type: 'song-metadata',
          bandId,
          durationChanged:
            song?.estimatedDurationMs !== parsed.song.estimatedDurationMs,
          availabilityChanged: false,
        });
        unsavedChanges.allowNextRemoval();
        leaveEditor();
      } else {
        const createdSongId = await createSong({
          bandId,
          lyrics,
          song: parsed.song,
        });
        await invalidateBandReadData(queryClient, {
          type: 'song-metadata',
          bandId,
          durationChanged: false,
          availabilityChanged: true,
        });
        unsavedChanges.allowNextRemoval();
        router.replace(getSongHref(bandId, createdSongId));
      }
    } catch (error) {
      setSubmitError(
        error instanceof SongMutationError
          ? error.message
          : 'Não foi possível salvar a música agora. Tente novamente.',
      );
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <BandAreaLayout
      activeSection="repertoire"
      bandId={bandId}
      currentRoute={
        songId
          ? (getSongEditHref(bandId, songId) as string)
          : (getSongCreateHref(bandId) as string)
      }
      headerAction={
        songId && canEdit
          ? {
              accessibilityLabel: 'Mais opções da música',
              icon: 'more',
              label: 'Mais opções',
              onPress: openLifecycleOptions,
            }
          : undefined
      }
      screenKind="edit"
      scrollable={false}
      title={title}
    >
      {isLoading ? <LoadingFeedback /> : null}
      {bandContextQuery.isError ? (
        <ErrorFeedback onRetry={() => void bandContextQuery.refetch()} />
      ) : null}
      {hasSongLoadError ? (
        <ErrorFeedback onRetry={() => void songQuery.refetch()} />
      ) : null}
      {termAcceptanceQuery.isError ? (
        <ErrorFeedback onRetry={() => void termAcceptanceQuery.refetch()} />
      ) : null}
      {!isLoading && !bandContextQuery.isError && !canEdit ? (
        <UnavailableFeedback title="Seu papel permite consultar o repertório, não editá-lo" />
      ) : null}
      {!isLoading && songId && !hasSongLoadError && !song ? (
        <UnavailableFeedback title="Música indisponível" />
      ) : null}
      <ActionNotice
        message={submitError ?? lifecycleNotice}
        onClose={() => {
          setSubmitError(null);
          setLifecycleNotice(null);
          setLifecycleNoticeTitle(null);
        }}
        title={
          submitError
            ? 'Aviso ao salvar música'
            : (lifecycleNoticeTitle ?? undefined)
        }
      />
      <EnrichmentPopup
        hasUsableSynchronizedLyrics={(candidate) =>
          candidate.instrumental !== true &&
          getConvertedCandidateLyrics(candidate).synchronizedDocument !== null
        }
        message={enrichmentMessage}
        onChooseDuration={chooseDuration}
        onClose={cancelEnrichment}
        onDismiss={() =>
          restoreEnrichmentTriggerFocus(enrichmentTrigger.current)
        }
        onRetry={startEnrichmentSearch}
        onSelectCandidate={selectCandidate}
        remainingSeconds={retryRemainingSeconds}
        state={enrichmentState}
        visible={popupVisible}
      />
      <UnsavedChangesPrompt
        onContinue={unsavedChanges.continueEditing}
        onDiscard={unsavedChanges.discardAndLeave}
        visible={unsavedChanges.confirmationVisible}
      />
      <SongLifecycleDialog
        errorMessage={lifecycleError}
        isSubmitting={lifecycleSubmitting}
        onArchive={handleArchive}
        onClose={closeLifecycleDialog}
        onRemove={handleRemove}
        onRestore={handleRestore}
        song={song ?? null}
        visible={lifecycleDialogVisible}
      />
      {!isLoading &&
      !bandContextQuery.isError &&
      !hasSongLoadError &&
      !termAcceptanceQuery.isError &&
      termAcceptanceQuery.data === true &&
      canEdit &&
      (!songId || song) ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.editor}
          testID="song-editor-keyboard-layout"
        >
          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            keyboardShouldPersistTaps="handled"
            testID="song-editor-scroll"
          >
            <SongEditorFieldView
              error={fieldErrors.title}
              label="Título da música *"
              onChangeText={(value) => setField('title', value)}
              placeholder="Ex.: A rua acende devagar"
              value={values.title}
            />
            <AutocompleteField
              accessibilityLabel="Artista/Banda"
              error={fieldErrors.originalArtist}
              label="Artista/Banda"
              onChangeText={(value) => setField('originalArtist', value)}
              options={originalArtistOptions}
              placeholder="Ex.: Artista original"
              value={values.originalArtist}
            />

            <SongDurationFieldView
              containerStyle={styles.durationField}
              error={fieldErrors.duration}
              onChangeText={(value) => setField('duration', value)}
              value={values.duration}
            />

            <View style={styles.inlineFields}>
              <SongEditorFieldView
                containerStyle={styles.smallField}
                error={fieldErrors.musicalKey}
                label="Tom"
                onChangeText={(value) => setField('musicalKey', value)}
                placeholder="Ex.: G"
                value={values.musicalKey}
              />
              <SongEditorFieldView
                containerStyle={styles.smallField}
                error={fieldErrors.bpm}
                keyboardType="number-pad"
                label="BPM"
                onChangeText={(value) => setField('bpm', value)}
                placeholder="Ex.: 120"
                value={values.bpm}
              />
            </View>

            <SongEditorFieldView
              error={fieldErrors.youtubeReference}
              keyboardType="url"
              label="Link de referência do YouTube"
              onChangeText={(value) => setField('youtubeReference', value)}
              placeholder="https://youtu.be/..."
              value={values.youtubeReference}
            />
            <SongEditorFieldView
              error={fieldErrors.notes}
              label="Observações"
              multiline
              onChangeText={(value) => setField('notes', value)}
              placeholder="Informações úteis para a banda"
              value={values.notes}
            />

            <LyricDocumentEditor
              document={lyrics}
              onChange={(document) => {
                currentDraft.current = {
                  ...currentDraft.current,
                  lyrics: document,
                };
                setEditedLyrics({ songId: songId ?? null, document });
                setSubmitError(null);
              }}
            />
          </ScrollView>

          <KeyboardDismissRegion>
            <View style={styles.footer}>
              <Pressable
                accessibilityHint="Busca sugestões para completar artista, duração ou letra no rascunho."
                accessibilityLabel="Completar música"
                accessibilityRole="button"
                accessibilityState={{
                  disabled:
                    !values.title.trim() || isSubmitting || operationIsActive,
                }}
                disabled={
                  !values.title.trim() || isSubmitting || operationIsActive
                }
                ref={enrichmentTrigger}
                onPress={startEnrichmentSearch}
                style={({ pressed }) => [
                  styles.enrichmentButton,
                  pressed && styles.enrichmentButtonPressed,
                  (!values.title.trim() || isSubmitting || operationIsActive) &&
                    styles.enrichmentButtonDisabled,
                ]}
                testID="song-enrichment-trigger"
              >
                <AppIcon
                  color={
                    !values.title.trim() || isSubmitting || operationIsActive
                      ? colors.text.disabled
                      : colors.action.primary
                  }
                  name="wand"
                  size={20}
                />
              </Pressable>
              <View style={styles.footerActions}>
                <AppButton
                  disabled={isSubmitting || operationIsActive || popupVisible}
                  label="Cancelar"
                  onPress={leaveEditor}
                  style={styles.footerTextButton}
                  variant="secondary"
                />
                <AppButton
                  disabled={isSubmitting || operationIsActive || popupVisible}
                  icon="check"
                  label={isSubmitting ? 'Salvando…' : 'Salvar música'}
                  onPress={() => void handleSave()}
                  style={styles.footerTextButton}
                  testID="song-editor-save"
                />
              </View>
            </View>
          </KeyboardDismissRegion>
        </KeyboardAvoidingView>
      ) : null}
      {!isLoading &&
      !bandContextQuery.isError &&
      !hasSongLoadError &&
      !termAcceptanceQuery.isError &&
      canEdit &&
      termAcceptanceQuery.data === false ? (
        <BandTermAcceptanceDialog
          errorMessage={termAcceptanceError}
          onClose={leaveEditor}
          onSubmit={() => void handleTermAcceptance()}
          submitting={isAcceptingTerm}
          visible
        />
      ) : null}
    </BandAreaLayout>
  );
}

interface SongEditorFieldViewProps {
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly error?: string;
  readonly keyboardType?: 'default' | 'number-pad' | 'url';
  readonly label: string;
  readonly multiline?: boolean;
  readonly onChangeText: (value: string) => void;
  readonly placeholder: string;
  readonly value: string;
}

function SongEditorFieldView({
  containerStyle,
  error,
  keyboardType = 'default',
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: SongEditorFieldViewProps) {
  return (
    <View style={[styles.field, containerStyle]}>
      <KeyboardDismissRegion>
        <View>
          <AppText variant="caption">{label}</AppText>
        </View>
      </KeyboardDismissRegion>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ? `Erro: ${error}` : undefined}
        autoCapitalize={keyboardType === 'url' ? 'none' : 'sentences'}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          multiline && Platform.OS === 'web' && styles.multilineInputWeb,
        ]}
        value={value}
      />
      {error ? (
        <AppText accessibilityRole="alert" style={styles.fieldError}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

interface SongDurationFieldViewProps {
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly error?: string;
  readonly onChangeText: (value: string) => void;
  readonly value: string;
}

function SongDurationFieldView({
  containerStyle,
  error,
  onChangeText,
  value,
}: SongDurationFieldViewProps) {
  const parts = durationToParts(value);

  const updatePart = (part: keyof DurationParts, nextValue: string) => {
    onChangeText(
      durationFromEditorParts({
        ...parts,
        [part]: nextValue.replace(/\D/g, ''),
      }),
    );
  };

  return (
    <View style={[styles.field, containerStyle]}>
      <KeyboardDismissRegion>
        <View>
          <AppText variant="caption">Duração</AppText>
        </View>
      </KeyboardDismissRegion>
      <View style={styles.durationParts}>
        <DurationPartInput
          accessibilityLabel="Horas da duração"
          onChangeText={(nextValue) => updatePart('hours', nextValue)}
          value={parts.hours}
          suffix="h"
        />
        <DurationPartInput
          accessibilityLabel="Minutos da duração"
          onChangeText={(nextValue) => updatePart('minutes', nextValue)}
          value={parts.minutes}
          suffix="min"
        />
        <DurationPartInput
          accessibilityLabel="Segundos da duração"
          onChangeText={(nextValue) => updatePart('seconds', nextValue)}
          value={parts.seconds}
          suffix="s"
        />
      </View>
      {error ? (
        <AppText accessibilityRole="alert" style={styles.fieldError}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

interface DurationPartInputProps {
  readonly accessibilityLabel: string;
  readonly onChangeText: (value: string) => void;
  readonly suffix: string;
  readonly value: string;
}

function DurationPartInput({
  accessibilityLabel,
  onChangeText,
  suffix,
  value,
}: DurationPartInputProps) {
  return (
    <View style={styles.durationPart}>
      <SpinButton
        accessibilityLabel={accessibilityLabel}
        decrementLabel={`Diminuir ${accessibilityLabel.toLowerCase()}`}
        incrementLabel={`Aumentar ${accessibilityLabel.toLowerCase()}`}
        max={suffix === 'h' ? 999 : 59}
        maxLength={suffix === 'h' ? 3 : 2}
        onChangeText={onChangeText}
        value={value}
      />
      <AppText style={styles.durationSuffix} tone="muted" variant="caption">
        {suffix}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    minHeight: 0,
  },
  formContent: {
    alignItems: 'stretch',
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: layout.contentMaxWidth,
    padding: spacing.xl,
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    backgroundColor: colors.background.raised,
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  footerActions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    minWidth: 0,
  },
  footerTextButton: {
    paddingHorizontal: spacing.sm,
  },
  enrichmentButton: {
    alignItems: 'center',
    backgroundColor: colors.background.base,
    borderColor: colors.border.control,
    borderRadius: radii.md,
    borderWidth: 1,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  enrichmentButtonPressed: {
    backgroundColor: colors.background.pressed,
  },
  enrichmentButtonDisabled: {
    opacity: 0.55,
  },
  field: {
    flexGrow: 0,
    flexShrink: 0,
    gap: spacing.xs,
    minWidth: 160,
  },
  fieldError: {
    color: colors.semantic.danger,
  },
  input: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text.primary,
    fontSize: 16,
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
  },
  inlineFields: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  multilineInput: {
    minHeight: 112,
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
  },
  multilineInputWeb: {
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 0,
    height: 120,
    maxHeight: 120,
    minHeight: 120,
    width: '100%',
  },
  smallField: {
    flexGrow: 1,
    flexBasis: 88,
  },
  durationParts: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    maxWidth: '100%',
    width: '100%',
  },
  durationPart: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    flexBasis: 0,
    maxWidth: '100%',
    minWidth: 0,
  },
  durationSuffix: {
    marginLeft: spacing.xs,
  },
  durationField: {
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: '100%',
    width: '100%',
  },
});
