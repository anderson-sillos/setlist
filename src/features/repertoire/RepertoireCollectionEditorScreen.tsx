import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { UnsavedChangesPrompt } from '@/components/feedback/UnsavedChangesPrompt';
import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import { OptionMenu, SearchField } from '@/components/ui/ListControls';
import { WebRefreshButton } from '@/components/ui/ScreenDataRefresh';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  useSaveRepertoireCollection,
  useRepertoireCollections,
  useSongs,
  useUserBands,
} from '@/data/queries';
import type { EntityId, RepertoireCollection, Song } from '@/domain';
import { RepertoireCollectionError } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import type { EditActions } from '@/features/navigation/types';
import {
  getRepertoireCollectionCreateHref,
  getRepertoireCollectionEditHref,
  getRepertoireCollectionHref,
  getRepertoireCollectionsHref,
} from '@/features/navigation/routes';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { formatSongDuration } from '@/utils/duration';
import {
  filterAndSortRepertoireSongs,
  repertoireFilters,
  repertoireSorts,
  type RepertoireFilter,
  type RepertoireSort,
} from './repertoireQuery';
import {
  lyricStatusIcons,
  lyricStatusLabels,
  lyricStatusTones,
} from './songPresentation';

interface RepertoireCollectionEditorScreenProps {
  readonly bandId: EntityId;
  readonly collectionId?: EntityId;
}

interface RepertoireCollectionEditorFrameProps {
  readonly bandId: EntityId;
  readonly children: ReactNode;
  readonly collectionId?: EntityId;
  readonly editActions?: EditActions;
}

export function RepertoireCollectionEditorScreen({
  bandId,
  collectionId,
}: RepertoireCollectionEditorScreenProps) {
  const collectionsQuery = useRepertoireCollections(bandId);
  const songsQuery = useSongs(bandId, true);
  const userBandsQuery = useUserBands();
  const { onRefresh, refreshing } = useScreenDataRefresh([
    collectionsQuery,
    songsQuery,
    userBandsQuery,
  ]);
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';
  const summary = collectionsQuery.data?.find(
    ({ collection }) => collection.id === collectionId,
  );
  const isLoading =
    collectionsQuery.isPending ||
    songsQuery.isPending ||
    userBandsQuery.isPending;
  const isError =
    collectionsQuery.isError || songsQuery.isError || userBandsQuery.isError;

  if (isLoading) {
    return (
      <RepertoireCollectionEditorFrame
        bandId={bandId}
        collectionId={collectionId}
      >
        <LoadingFeedback />
      </RepertoireCollectionEditorFrame>
    );
  }

  if (isError) {
    return (
      <RepertoireCollectionEditorFrame
        bandId={bandId}
        collectionId={collectionId}
      >
        <ErrorFeedback
          onRetry={() => {
            void collectionsQuery.refetch();
            void songsQuery.refetch();
            void userBandsQuery.refetch();
          }}
        />
        <WebRefreshButton onRefresh={onRefresh} refreshing={refreshing} />
      </RepertoireCollectionEditorFrame>
    );
  }

  if (!canEdit || (collectionId && !summary)) {
    return (
      <RepertoireCollectionEditorFrame
        bandId={bandId}
        collectionId={collectionId}
      >
        <UnavailableFeedback title="Seu papel não permite editar coleções ou a coleção está indisponível" />
      </RepertoireCollectionEditorFrame>
    );
  }

  return (
    <RepertoireCollectionEditorForm
      bandId={bandId}
      collectionId={collectionId}
      existingCollections={collectionsQuery.data ?? []}
      initialCollection={summary?.collection ?? null}
      key={collectionId ?? 'new'}
      orderedSongIds={summary?.songs.map(({ id }) => id) ?? []}
      songs={songsQuery.data ?? []}
    />
  );
}

interface RepertoireCollectionEditorFormProps {
  readonly bandId: EntityId;
  readonly collectionId?: EntityId;
  readonly existingCollections: readonly {
    readonly collection: RepertoireCollection;
  }[];
  readonly initialCollection: RepertoireCollection | null;
  readonly orderedSongIds: readonly EntityId[];
  readonly songs: readonly Song[];
}

function RepertoireCollectionEditorForm({
  bandId,
  collectionId,
  existingCollections,
  initialCollection,
  orderedSongIds,
  songs,
}: RepertoireCollectionEditorFormProps) {
  const router = useRouter();
  const saveCollection = useSaveRepertoireCollection(bandId);
  const submissionLock = useRef(false);
  const [name, setName] = useState(initialCollection?.name ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSongIds, setSelectedSongIds] =
    useState<readonly EntityId[]>(orderedSongIds);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RepertoireFilter>('all');
  const [sort, setSort] = useState<RepertoireSort>('title');
  const initialName = initialCollection?.name ?? '';
  const selectionDirty =
    selectedSongIds.length !== orderedSongIds.length ||
    selectedSongIds.some((songId, index) => orderedSongIds[index] !== songId);
  const dirty = name !== initialName || selectionDirty;
  const filteredSongs = useMemo(
    () => filterAndSortRepertoireSongs(songs, search, filter, sort),
    [filter, search, sort, songs],
  );
  const songsById = useMemo(
    () => new Map(songs.map((song) => [song.id, song])),
    [songs],
  );
  const selectedSongs = selectedSongIds.flatMap((songId) => {
    const song = songsById.get(songId);
    return song ? [song] : [];
  });
  const selectedSongIdSet = useMemo(
    () => new Set(selectedSongIds),
    [selectedSongIds],
  );
  const allVisibleSongsSelected =
    filteredSongs.length > 0 &&
    filteredSongs.every(({ id }) => selectedSongIdSet.has(id));

  const toggleSong = (songId: EntityId) => {
    setSelectedSongIds((current) =>
      current.includes(songId)
        ? current.filter((currentSongId) => currentSongId !== songId)
        : [...current, songId],
    );
  };

  const selectVisibleSongs = () => {
    setSelectedSongIds((current) => {
      const next = [...current];
      const selected = new Set(current);
      filteredSongs.forEach(({ id }) => {
        if (!selected.has(id)) {
          next.push(id);
          selected.add(id);
        }
      });
      return next;
    });
  };
  const unsavedChanges = useUnsavedChangesGuard({
    dirty,
    saving: isSubmitting,
  });

  const leaveEditor = () => {
    router.replace(
      collectionId
        ? getRepertoireCollectionHref(bandId, collectionId)
        : getRepertoireCollectionsHref(bandId),
    );
  };

  const requestLeave = () => {
    if (dirty) {
      unsavedChanges.requestConfirmation(leaveEditor);
      return;
    }

    leaveEditor();
  };

  const handleSave = async () => {
    if (submissionLock.current) {
      return;
    }

    const normalizedName = name.trim();
    const nameLength = Array.from(normalizedName).length;
    if (nameLength === 0) {
      setFieldError('Informe um nome para a coleção.');
      setSubmitError(null);
      return;
    }
    if (nameLength > 120) {
      setFieldError('O nome pode ter até 120 caracteres.');
      setSubmitError(null);
      return;
    }

    const duplicatedName = existingCollections.some(
      ({ collection }) =>
        collection.id !== collectionId &&
        collection.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );
    if (duplicatedName) {
      setFieldError('Já existe uma coleção com esse nome nesta banda.');
      setSubmitError(null);
      return;
    }

    submissionLock.current = true;
    setIsSubmitting(true);
    setFieldError(null);
    setSubmitError(null);

    try {
      const savedCollection = await saveCollection.mutateAsync({
        ...(initialCollection
          ? {
              collectionId: initialCollection.id,
              expectedUpdatedAt: initialCollection.updatedAt,
            }
          : {}),
        name: normalizedName,
        orderedSongIds: selectedSongIds,
      });

      unsavedChanges.allowNextRemoval();
      router.replace(getRepertoireCollectionHref(bandId, savedCollection.id));
    } catch (error) {
      if (error instanceof RepertoireCollectionError) {
        if (error.code === 'invalid_name' || error.code === 'duplicate_name') {
          setFieldError(error.message);
        } else {
          setSubmitError(error.message);
        }
      } else {
        setSubmitError(
          'Não foi possível salvar a coleção agora. Tente novamente.',
        );
      }
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  };

  const editActions: EditActions = {
    onCancel: requestLeave,
    onSave: () => void handleSave(),
    saveDisabled: isSubmitting || (Boolean(collectionId) && !dirty),
  };

  return (
    <RepertoireCollectionEditorFrame
      bandId={bandId}
      collectionId={collectionId}
      editActions={editActions}
    >
      <UnsavedChangesPrompt
        onContinue={unsavedChanges.continueEditing}
        onDiscard={unsavedChanges.discardAndLeave}
        visible={unsavedChanges.confirmationVisible}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.editor}
        testID="collection-editor-keyboard-layout"
      >
        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          testID="collection-editor-scroll"
        >
          <AppText tone="muted">
            Reúna músicas do repertório por ocasião ou estilo. As coleções são
            opcionais e podem começar vazias.
          </AppText>
          <View style={styles.field}>
            <AppText variant="caption">Nome da coleção</AppText>
            <TextInput
              accessibilityLabel="Nome da coleção"
              autoCapitalize="words"
              maxLength={240}
              onChangeText={(value) => {
                setName(value);
                setFieldError(null);
                setSubmitError(null);
              }}
              placeholder="Ex.: Festa, Acústico"
              placeholderTextColor={colors.text.muted}
              style={styles.input}
              value={name}
            />
            <View style={styles.fieldFooter}>
              {fieldError ? (
                <AppText accessibilityRole="alert" style={styles.fieldError}>
                  {fieldError}
                </AppText>
              ) : (
                <View />
              )}
              <AppText tone="muted" variant="caption">
                {Array.from(name).length}/120
              </AppText>
            </View>
          </View>
          <View style={styles.songSection}>
            <View style={styles.songSectionHeading}>
              <AppText variant="heading">Músicas</AppText>
              <AppText tone="muted">
                {selectedSongIds.length === 1
                  ? '1 escolhida'
                  : `${selectedSongIds.length} escolhidas`}
              </AppText>
            </View>
            <View style={styles.searchRow}>
              <SearchField
                accessibilityLabel="Buscar música por título ou artista"
                onChangeText={setSearch}
                placeholder="Buscar música ou artista/banda"
                value={search}
              />
            </View>
            <View style={styles.controls}>
              <OptionMenu
                active={filter !== 'all'}
                accessibilityLabel="Alterar filtros da seleção de músicas"
                compact
                icon="filter"
                label="Filtrar"
                onChange={setFilter}
                options={repertoireFilters}
                value={filter}
              />
              <OptionMenu
                active={sort !== 'title'}
                accessibilityLabel="Alterar ordenação das músicas"
                compact
                icon="sort"
                label="Ordenar"
                onChange={setSort}
                options={repertoireSorts}
                value={sort}
              />
              <AppButton
                disabled={filteredSongs.length === 0 || allVisibleSongsSelected}
                icon="check"
                label={`Selecionar resultados (${filteredSongs.length})`}
                onPress={selectVisibleSongs}
                variant="secondary"
              />
            </View>
            {filteredSongs.length ? (
              <View style={styles.songList}>
                {filteredSongs.map((song) => {
                  const selected = selectedSongIdSet.has(song.id);
                  return (
                    <Pressable
                      accessibilityLabel={`${selected ? 'Remover seleção de' : 'Selecionar'} ${song.title}`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      key={song.id}
                      onPress={() => toggleSong(song.id)}
                      style={({ pressed }) => [
                        styles.songOption,
                        pressed && styles.songOptionPressed,
                      ]}
                    >
                      <Card
                        style={styles.songOptionCard}
                        tone={selected ? 'accent' : 'default'}
                      >
                        <View style={styles.songOptionIcon}>
                          {selected ? (
                            <AppIcon
                              color={colors.action.primary}
                              name="check"
                              size={20}
                            />
                          ) : (
                            <AppIcon
                              color={colors.text.secondary}
                              name="music"
                              size={20}
                            />
                          )}
                        </View>
                        <View style={styles.songOptionCopy}>
                          <View style={styles.songOptionTitle}>
                            <AppText variant="heading">{song.title}</AppText>
                            <StatusPill
                              accessibilityLabel={`Status da letra: ${lyricStatusLabels[song.lyricStatus]}`}
                              icon={lyricStatusIcons[song.lyricStatus]}
                              tone={lyricStatusTones[song.lyricStatus]}
                            />
                            {song.archivedAt !== null ? (
                              <StatusPill
                                accessibilityLabel="Música arquivada"
                                icon="archive"
                                tone="warning"
                              />
                            ) : null}
                          </View>
                          <View style={styles.songOptionMeta}>
                            <AppText numberOfLines={1} tone="muted">
                              {song.originalArtist ??
                                'Artista/Banda não informado'}
                            </AppText>
                            <AppText tone="muted" variant="caption">
                              {song.estimatedDurationMs === null
                                ? 'Duração não informada'
                                : formatSongDuration(song.estimatedDurationMs)}
                            </AppText>
                          </View>
                        </View>
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <ListEmptyState
                message="Tente mudar a busca ou os filtros para encontrar músicas."
                title="Nenhuma música encontrada"
              />
            )}
            <Card style={styles.selectionReview}>
              <AppText variant="heading">
                Músicas escolhidas ({selectedSongs.length})
              </AppText>
              {selectedSongs.length ? (
                <View style={styles.selectedSongList}>
                  {selectedSongs.map((song, index) => (
                    <View key={song.id} style={styles.selectedSongRow}>
                      <AppText style={styles.selectedPosition} tone="muted">
                        {index + 1}
                      </AppText>
                      <AppText style={styles.selectedSongTitle}>
                        {song.title}
                      </AppText>
                      <AppButton
                        accessibilityLabel={`Remover ${song.title} da coleção`}
                        icon="remove"
                        label="Remover"
                        onPress={() => toggleSong(song.id)}
                        variant="tertiary"
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <AppText tone="muted">
                  Nenhuma música escolhida. Você pode salvar a coleção vazia.
                </AppText>
              )}
            </Card>
          </View>
          {submitError ? (
            <AppText accessibilityRole="alert" style={styles.fieldError}>
              {submitError}
            </AppText>
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          <AppButton
            disabled={isSubmitting}
            label="Cancelar"
            onPress={requestLeave}
            variant="secondary"
          />
          <AppButton
            accessibilityLabel="Salvar coleção"
            disabled={isSubmitting || (Boolean(collectionId) && !dirty)}
            icon="check"
            label={isSubmitting ? 'Salvando…' : 'Salvar coleção'}
            onPress={() => void handleSave()}
          />
        </View>
      </KeyboardAvoidingView>
    </RepertoireCollectionEditorFrame>
  );
}

function RepertoireCollectionEditorFrame({
  bandId,
  children,
  collectionId,
  editActions,
}: RepertoireCollectionEditorFrameProps) {
  return (
    <BandAreaLayout
      activeSection="repertoire"
      bandId={bandId}
      currentRoute={
        collectionId
          ? (getRepertoireCollectionEditHref(bandId, collectionId) as string)
          : (getRepertoireCollectionCreateHref(bandId) as string)
      }
      editActions={editActions}
      screenKind="edit"
      scrollable={false}
      title={collectionId ? 'Editar coleção' : 'Nova coleção'}
    >
      {children}
    </BandAreaLayout>
  );
}

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    minHeight: 0,
  },
  formContent: {
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: layout.contentMaxWidth,
    padding: spacing.xl,
    width: '100%',
  },
  field: {
    gap: spacing.xs,
  },
  songSection: {
    gap: spacing.md,
  },
  songSectionHeading: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  searchRow: {
    width: '100%',
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  songList: {
    gap: spacing.sm,
  },
  songOption: {
    borderRadius: radii.lg,
  },
  songOptionPressed: {
    opacity: 0.72,
  },
  songOptionCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 76,
    padding: spacing.md,
  },
  songOptionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  songOptionCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  songOptionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  songOptionMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  selectionReview: {
    alignSelf: 'center',
    gap: spacing.sm,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
  },
  selectedSongList: {
    gap: spacing.xs,
  },
  selectedSongRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  selectedPosition: {
    fontVariant: ['tabular-nums'],
    minWidth: 24,
    textAlign: 'right',
  },
  selectedSongTitle: {
    flex: 1,
    minWidth: 0,
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
  fieldFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldError: {
    color: colors.semantic.danger,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    backgroundColor: colors.background.raised,
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
});
