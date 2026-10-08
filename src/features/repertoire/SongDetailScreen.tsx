import { Link, useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  ErrorFeedback,
  LoadingFeedback,
  TemporaryFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { UnsavedChangesPrompt } from '@/components/feedback/UnsavedChangesPrompt';
import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { WebRefreshButton } from '@/components/ui/ScreenDataRefresh';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  useRepertoireCollections,
  useSetSongRepertoireCollections,
  useSong,
  useUserBands,
} from '@/data/queries';
import type { EntityId, RepertoireCollection } from '@/domain';
import { RepertoireCollectionError } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import { ContentReportDialog } from '@/features/moderation/ContentReportDialog';
import {
  getBandSectionHref,
  getRepertoireCollectionFilterHref,
  getSongEditHref,
  getSongHref,
  getSongLyricsHref,
} from '@/features/navigation/routes';
import { getLayoutMode } from '@/theme/responsive';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { formatRelativeUpdate } from '@/utils/dateTime';
import { formatSongDuration } from '@/utils/duration';
import { blurWebFocus } from '@/utils/focus';
import { normalizeYoutubeReference } from '@/utils/youtubeReference';
import { SongCollectionMembershipDialog } from './SongCollectionMembershipDialog';
import { SongLyricsContent } from './SongLyricsContent';
import {
  lyricStatusIcons,
  lyricStatusLabels,
  lyricStatusTones,
} from './songPresentation';

interface SongDetailScreenProps {
  readonly bandId: EntityId;
  readonly now?: Date;
  readonly songId: EntityId;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}

interface SongCollectionLinkProps {
  readonly bandId: EntityId;
  readonly collection: RepertoireCollection;
}

function SongCollectionLink({ bandId, collection }: SongCollectionLinkProps) {
  const [focused, setFocused] = useState(false);

  return (
    <Link
      href={getRepertoireCollectionFilterHref(bandId, collection.id)}
      onPress={blurWebFocus}
      asChild
    >
      <Pressable
        accessibilityHint="Abre o repertório filtrado por esta coleção."
        accessibilityLabel={`Ver músicas da coleção ${collection.name}`}
        accessibilityRole="link"
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        style={({ pressed }) => [
          styles.collectionTag,
          focused && styles.collectionTagFocused,
          pressed && styles.collectionTagPressed,
        ]}
        testID={`song-collection-${collection.id}`}
      >
        <AppText style={styles.collectionTagText} variant="caption">
          {collection.name}
        </AppText>
      </Pressable>
    </Link>
  );
}

export function SongDetailScreen({
  bandId,
  now = new Date(),
  songId,
  viewportHeight,
  viewportWidth,
}: SongDetailScreenProps) {
  const router = useRouter();
  const [reportVisible, setReportVisible] = useState(false);
  const [reportActionFocused, setReportActionFocused] = useState(false);
  const [collectionManagerVisible, setCollectionManagerVisible] =
    useState(false);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<
    ReadonlySet<EntityId>
  >(() => new Set());
  const [collectionMembershipError, setCollectionMembershipError] = useState<
    string | null
  >(null);
  const [collectionMembershipSaved, setCollectionMembershipSaved] =
    useState(false);
  const [savingCollectionMembership, setSavingCollectionMembership] =
    useState(false);
  const collectionMembershipLock = useRef(false);
  const dimensions = useWindowDimensions();
  const layoutMode = getLayoutMode(viewportWidth ?? dimensions.width);
  const collectionsQuery = useRepertoireCollections(bandId);
  const songQuery = useSong(bandId, songId);
  const userBandsQuery = useUserBands();
  const setSongCollections = useSetSongRepertoireCollections(bandId);
  const { onRefresh, refreshing } = useScreenDataRefresh([
    collectionsQuery,
    songQuery,
    userBandsQuery,
  ]);
  const song = songQuery.data;
  const songCollections =
    collectionsQuery.data?.flatMap((summary) =>
      summary.songs.some(({ id }) => id === songId) ? [summary.collection] : [],
    ) ?? [];
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';
  const availableCollections =
    collectionsQuery.data?.map(({ collection }) => collection) ?? [];
  const currentSongCollectionIds = new Set(songCollections.map(({ id }) => id));
  const collectionMembershipDirty =
    selectedCollectionIds.size !== currentSongCollectionIds.size ||
    Array.from(selectedCollectionIds).some(
      (collectionId) => !currentSongCollectionIds.has(collectionId),
    );
  const unsavedCollectionChanges = useUnsavedChangesGuard({
    dirty: collectionManagerVisible && collectionMembershipDirty,
    saving: savingCollectionMembership,
  });
  const youtubeReference = normalizeYoutubeReference(song?.youtubeReference);
  const openYoutubeReference = () => {
    if (!youtubeReference) {
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(youtubeReference, '_blank', 'noopener,noreferrer');
      return;
    }

    void Linking.openURL(youtubeReference);
  };
  const openCollectionManager = () => {
    if (!song || !canEdit) return;

    setSelectedCollectionIds(new Set(songCollections.map(({ id }) => id)));
    setCollectionMembershipError(null);
    setCollectionManagerVisible(true);
  };
  const dismissCollectionManager = () => {
    if (collectionMembershipLock.current) return;

    setCollectionManagerVisible(false);
    setSelectedCollectionIds(new Set(songCollections.map(({ id }) => id)));
    setCollectionMembershipError(null);
  };
  const requestCloseCollectionManager = () => {
    if (collectionMembershipDirty) {
      unsavedCollectionChanges.requestConfirmation(dismissCollectionManager);
      return;
    }

    dismissCollectionManager();
  };
  const toggleCollectionMembership = (collectionId: EntityId) => {
    setSelectedCollectionIds((current) => {
      const next = new Set(current);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
    setCollectionMembershipError(null);
  };
  const saveCollectionMembership = async () => {
    if (!song || !canEdit || !collectionMembershipDirty) return;
    if (collectionMembershipLock.current) return;

    const validCollectionIds = availableCollections
      .filter(({ id }) => selectedCollectionIds.has(id))
      .map(({ id }) => id);
    const affectedCollectionIds = new Set([
      ...currentSongCollectionIds,
      ...validCollectionIds,
    ]);
    const expectedRevisions = Object.fromEntries(
      (collectionsQuery.data ?? [])
        .filter(({ collection }) => affectedCollectionIds.has(collection.id))
        .map(({ collection }) => [collection.id, collection.updatedAt]),
    );

    collectionMembershipLock.current = true;
    setSavingCollectionMembership(true);
    setCollectionMembershipError(null);
    try {
      await setSongCollections.mutateAsync({
        collectionIds: validCollectionIds,
        expectedRevisions,
        songId,
      });
      setCollectionManagerVisible(false);
      setCollectionMembershipSaved(true);
    } catch (error) {
      setCollectionMembershipError(
        error instanceof RepertoireCollectionError
          ? error.message
          : 'Não foi possível atualizar as coleções agora. Tente novamente.',
      );
    } finally {
      collectionMembershipLock.current = false;
      setSavingCollectionMembership(false);
    }
  };

  return (
    <BandAreaLayout
      activeSection="repertoire"
      backHref={getBandSectionHref(bandId, 'repertoire')}
      bandId={bandId}
      currentRoute={getSongHref(bandId, songId) as string}
      headerAction={
        canEdit
          ? {
              accessibilityLabel: 'Editar música',
              icon: 'edit',
              label: 'Editar música',
              onPress: () => router.push(getSongEditHref(bandId, songId)),
            }
          : undefined
      }
      screenKind="detail"
      onRefresh={onRefresh}
      refreshing={refreshing}
      title="Detalhes da música"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      <ContentReportDialog
        bandId={bandId}
        kind="song"
        onClose={() => setReportVisible(false)}
        targetId={songId}
        targetName={song?.title ?? 'Música'}
        visible={reportVisible}
      />
      <SongCollectionMembershipDialog
        collections={availableCollections}
        errorMessage={collectionMembershipError}
        isSaving={savingCollectionMembership}
        onClose={requestCloseCollectionManager}
        onSave={() => void saveCollectionMembership()}
        onToggle={toggleCollectionMembership}
        saveDisabled={!collectionMembershipDirty}
        selectedCollectionIds={selectedCollectionIds}
        songTitle={song?.title ?? 'Música'}
        visible={collectionManagerVisible}
      />
      <UnsavedChangesPrompt
        onContinue={unsavedCollectionChanges.continueEditing}
        onDiscard={unsavedCollectionChanges.discardAndLeave}
        visible={unsavedCollectionChanges.confirmationVisible}
      />
      {collectionMembershipSaved ? (
        <TemporaryFeedback
          messageKey="collection-memberships-saved"
          onDismiss={() => setCollectionMembershipSaved(false)}
        />
      ) : null}
      {songQuery.isPending || userBandsQuery.isPending ? (
        <LoadingFeedback />
      ) : null}
      {songQuery.isError || userBandsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void songQuery.refetch();
            void userBandsQuery.refetch();
          }}
        />
      ) : null}
      {!songQuery.isPending && !songQuery.isError && !song ? (
        <UnavailableFeedback title="Música indisponível" />
      ) : null}
      <WebRefreshButton onRefresh={onRefresh} refreshing={refreshing} />

      {song ? (
        <View style={styles.detail} testID={`song-detail-${layoutMode}`}>
          <Card style={styles.compactHeader}>
            <View style={styles.titleLine}>
              <View style={styles.titleCopy}>
                <AppText
                  accessibilityRole="header"
                  style={styles.songTitle}
                  variant="title"
                >
                  {song.title}
                </AppText>
                <AppText tone="muted">
                  {song.originalArtist ?? 'Artista/Banda não informado'}
                </AppText>
              </View>
            </View>
            <View style={styles.summaryLine}>
              <StatusPill
                accessibilityLabel={`Status da letra: ${lyricStatusLabels[song.lyricStatus]}`}
                icon={lyricStatusIcons[song.lyricStatus]}
                tone={lyricStatusTones[song.lyricStatus]}
              />
              {song.archivedAt ? (
                <StatusPill tone="warning">Arquivada</StatusPill>
              ) : null}
              <View
                accessibilityLabel={`Duração ${formatSongDuration(song.estimatedDurationMs)}`}
                accessible
                style={styles.durationMeta}
              >
                <AppIcon
                  color={colors.text.secondary}
                  name="duration"
                  size={14}
                />
                <AppText variant="caption">
                  Duração · {formatSongDuration(song.estimatedDurationMs)}
                </AppText>
              </View>
              <AppText tone="muted" variant="caption">
                Atualizada {formatRelativeUpdate(song.updatedAt, now)}
              </AppText>
            </View>
            <View style={styles.simpleMetadata}>
              <AppText tone="muted" variant="caption">
                Tom · {song.musicalKey ?? '—'}
              </AppText>
              <AppText tone="muted" variant="caption">
                BPM · {song.bpm ?? '—'}
              </AppText>
            </View>
            {songCollections.length > 0 ? (
              <View
                accessibilityLabel={`Coleções: ${songCollections
                  .map(({ name }) => name)
                  .join(', ')}`}
                style={styles.collectionSection}
                testID="song-detail-collections"
              >
                <AppText tone="muted" variant="caption">
                  Coleções
                </AppText>
                <View style={styles.collectionTags}>
                  {songCollections.map((collection) => (
                    <SongCollectionLink
                      bandId={bandId}
                      collection={collection}
                      key={collection.id}
                    />
                  ))}
                </View>
              </View>
            ) : null}
            {canEdit ? (
              <AppButton
                accessibilityLabel="Organizar coleções da música"
                disabled={
                  collectionsQuery.isPending || collectionsQuery.isError
                }
                icon="edit"
                label="Organizar coleções"
                onPress={openCollectionManager}
                style={styles.manageCollectionsButton}
                variant="tertiary"
              />
            ) : null}
          </Card>

          {song.notes || youtubeReference ? (
            <Card style={styles.secondaryCard} testID="song-detail-context">
              {song.notes ? (
                <View style={styles.notes}>
                  <AppText accessibilityRole="header" variant="heading">
                    Observações
                  </AppText>
                  <AppText>{song.notes}</AppText>
                </View>
              ) : null}

              {youtubeReference ? (
                <AppButton
                  accessibilityLabel="Abrir referência no YouTube"
                  icon="externalLink"
                  label="Abrir no YouTube"
                  onPress={openYoutubeReference}
                  style={styles.youtubeButton}
                  variant="secondary"
                />
              ) : null}
            </Card>
          ) : null}

          <Card style={styles.lyricCard} tone="dark">
            <View style={styles.lyricHeader}>
              <AppText
                accessibilityRole="header"
                tone="inverse"
                variant="eyebrow"
              >
                Letra
              </AppText>
              {song.lyricStatus !== 'missing' ? (
                <AppButton
                  accessibilityLabel="Abrir letra em tela cheia"
                  icon="expand"
                  label="Tela cheia"
                  onPress={() => router.push(getSongLyricsHref(bandId, songId))}
                  style={styles.fullscreenButton}
                  variant="secondary"
                />
              ) : null}
            </View>
            <SongLyricsContent lyrics={song.lyrics} />
          </Card>
          <Pressable
            accessibilityLabel="Denunciar música"
            accessibilityHint="Abre o formulário para informar o motivo da denúncia."
            accessibilityRole="button"
            hitSlop={4}
            onBlur={() => setReportActionFocused(false)}
            onFocus={() => setReportActionFocused(true)}
            onPress={() => setReportVisible(true)}
            style={({ pressed }) => [
              styles.reportAction,
              reportActionFocused && styles.reportActionFocused,
              pressed && styles.reportActionPressed,
            ]}
          >
            <AppIcon color={colors.text.secondary} name="flag" size={17} />
          </Pressable>
        </View>
      ) : null}
    </BandAreaLayout>
  );
}

const styles = StyleSheet.create({
  detail: {
    gap: spacing.lg,
  },
  compactHeader: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  songTitle: {
    fontSize: 20,
    lineHeight: 34,
  },
  titleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  titleCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 220,
  },
  summaryLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  durationMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  simpleMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  collectionSection: {
    gap: spacing.xs,
  },
  collectionTags: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  collectionTag: {
    backgroundColor: colors.background.raised,
    borderColor: colors.border.subtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexShrink: 1,
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  collectionTagFocused: {
    borderColor: colors.border.focus,
    borderWidth: 2,
  },
  collectionTagPressed: {
    backgroundColor: colors.background.pressed,
  },
  collectionTagText: {
    flexShrink: 1,
  },
  manageCollectionsButton: {
    alignSelf: 'flex-start',
  },
  lyricCard: {
    gap: spacing.xl,
    minWidth: 0,
    width: '100%',
  },
  lyricHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  fullscreenButton: {
    paddingHorizontal: spacing.md,
  },
  secondaryCard: {
    gap: spacing.lg,
    minWidth: 0,
    width: '100%',
  },
  notes: {
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  youtubeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  reportAction: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  reportActionFocused: {
    borderColor: colors.border.focus,
    borderRadius: radii.pill,
    borderWidth: 2,
  },
  reportActionPressed: {
    opacity: 0.6,
  },
});
