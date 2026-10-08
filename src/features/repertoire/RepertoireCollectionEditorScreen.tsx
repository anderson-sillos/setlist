import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import {
  PanGestureHandler,
  State,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';

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
import { OptionSheet } from '@/components/ui/list-controls/OptionSheet';
import { WebRefreshButton } from '@/components/ui/ScreenDataRefresh';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  useSaveRepertoireCollection,
  useDeleteRepertoireCollection,
  useRepertoireCollections,
  useSongs,
  useUserBands,
} from '@/data/queries';
import type { EntityId, RepertoireCollection, Song } from '@/domain';
import { RepertoireCollectionError } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import type { EditActions } from '@/features/navigation/types';
import {
  getBandSectionHref,
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
import {
  getCollectionSongInsertionIndex,
  moveCollectionSong,
  type CollectionSongLayout,
} from './collectionSongOrder';

interface RepertoireCollectionEditorScreenProps {
  readonly bandId: EntityId;
  readonly collectionId?: EntityId;
  readonly initialSongIds?: readonly EntityId[];
  readonly returnToRepertoire?: boolean;
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
  initialSongIds = [],
  returnToRepertoire = false,
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

  const availableSongIds = new Set((songsQuery.data ?? []).map(({ id }) => id));
  const initialOrderedSongIds = summary
    ? summary.songs.map(({ id }) => id)
    : Array.from(new Set(initialSongIds)).filter((songId) =>
        availableSongIds.has(songId),
      );

  return (
    <RepertoireCollectionEditorForm
      bandId={bandId}
      collectionId={collectionId}
      existingCollections={collectionsQuery.data ?? []}
      initialCollection={summary?.collection ?? null}
      key={collectionId ?? `new-${initialOrderedSongIds.join('|')}`}
      orderedSongIds={initialOrderedSongIds}
      returnToRepertoire={returnToRepertoire}
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
  readonly returnToRepertoire: boolean;
  readonly songs: readonly Song[];
}

function RepertoireCollectionEditorForm({
  bandId,
  collectionId,
  existingCollections,
  initialCollection,
  orderedSongIds,
  returnToRepertoire,
  songs,
}: RepertoireCollectionEditorFormProps) {
  const router = useRouter();
  const saveCollection = useSaveRepertoireCollection(bandId);
  const deleteCollection = useDeleteRepertoireCollection(bandId);
  const submissionLock = useRef(false);
  const deletionLock = useRef(false);
  const songLayoutsRef = useRef(new Map<EntityId, CollectionSongLayout>());
  const dragSessionRef = useRef<{
    readonly originCenterY: number;
    readonly originScrollOffset: number;
    readonly songId: EntityId;
    targetIndex: number;
  } | null>(null);
  const scrollOffsetRef = useRef(0);
  const [name, setName] = useState(initialCollection?.name ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [revisionConflict, setRevisionConflict] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] =
    useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteRevisionConflict, setDeleteRevisionConflict] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggingSongId, setDraggingSongId] = useState<EntityId | null>(null);
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

  const registerSongLayout = (songId: EntityId, event: LayoutChangeEvent) => {
    const { height, y } = event.nativeEvent.layout;
    songLayoutsRef.current.set(songId, { height, songId, y });
  };

  const startSongDrag = (songId: EntityId) => {
    const layout = songLayoutsRef.current.get(songId);
    const index = selectedSongIds.indexOf(songId);
    if (!layout || index < 0) return;

    dragSessionRef.current = {
      originCenterY: layout.y + layout.height / 2,
      originScrollOffset: scrollOffsetRef.current,
      songId,
      targetIndex: index,
    };
    setDraggingSongId(songId);
  };

  const moveSongDrag = (translationY: number) => {
    const session = dragSessionRef.current;
    if (!session) return;
    const layouts = selectedSongIds.flatMap((id) => {
      const layout = songLayoutsRef.current.get(id);
      return layout ? [layout] : [];
    });
    if (layouts.length !== selectedSongIds.length) return;

    const targetCenterY =
      session.originCenterY +
      translationY +
      scrollOffsetRef.current -
      session.originScrollOffset;
    session.targetIndex = getCollectionSongInsertionIndex(
      layouts,
      session.songId,
      targetCenterY,
    );
  };

  const clearSongDrag = () => {
    dragSessionRef.current = null;
    setDraggingSongId(null);
  };

  const finishSongDrag = () => {
    const session = dragSessionRef.current;
    if (session) {
      setSelectedSongIds((current) =>
        moveCollectionSong(current, session.songId, session.targetIndex),
      );
    }
    clearSongDrag();
  };

  const moveSongBy = (songId: EntityId, offset: -1 | 1) => {
    setSelectedSongIds((current) => {
      const index = current.indexOf(songId);
      return moveCollectionSong(current, songId, index + offset);
    });
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
    saving: isSubmitting || isDeleting,
  });

  const leaveEditor = () => {
    if (returnToRepertoire) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(getBandSectionHref(bandId, 'repertoire'));
      }
      return;
    }

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
    if (submissionLock.current || deletionLock.current) {
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
    setRevisionConflict(false);

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
          setRevisionConflict(error.code === 'stale_revision');
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

  const handleDelete = async () => {
    if (!initialCollection || deletionLock.current || submissionLock.current) {
      return;
    }

    deletionLock.current = true;
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteRevisionConflict(false);
    try {
      await deleteCollection.mutateAsync({
        collectionId: initialCollection.id,
        expectedUpdatedAt: initialCollection.updatedAt,
      });
      unsavedChanges.allowNextRemoval();
      router.replace(getRepertoireCollectionsHref(bandId));
    } catch (error) {
      setDeleteError(
        error instanceof RepertoireCollectionError
          ? error.message
          : 'Não foi possível excluir a coleção agora. Tente novamente.',
      );
      setDeleteRevisionConflict(
        error instanceof RepertoireCollectionError &&
          error.code === 'stale_revision',
      );
    } finally {
      deletionLock.current = false;
      setIsDeleting(false);
    }
  };

  const editActions: EditActions = {
    onCancel: requestLeave,
    onSave: () => void handleSave(),
    saveDisabled:
      isSubmitting ||
      isDeleting ||
      (Boolean(collectionId) && (!dirty || revisionConflict)),
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
          onScroll={(event) => {
            scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
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
                <>
                  <AppText tone="muted" variant="caption">
                    Arraste pela alça ou use as setas para ordenar.
                  </AppText>
                  <View style={styles.selectedSongList}>
                    {selectedSongs.map((song, index) => (
                      <View
                        key={song.id}
                        onLayout={(event) => registerSongLayout(song.id, event)}
                        style={[
                          styles.selectedSongRow,
                          draggingSongId === song.id &&
                            styles.selectedSongDragging,
                        ]}
                        testID={`collection-song-row-${song.id}`}
                      >
                        <AppText style={styles.selectedPosition} tone="muted">
                          {index + 1}
                        </AppText>
                        <CollectionSongDragHandle
                          accessibilityLabel={`Arraste para reordenar ${song.title}`}
                          dragging={draggingSongId === song.id}
                          onCancel={clearSongDrag}
                          onEnd={finishSongDrag}
                          onMove={moveSongDrag}
                          onStart={() => startSongDrag(song.id)}
                          testID={`collection-song-drag-${song.id}`}
                        />
                        <AppText
                          numberOfLines={2}
                          style={styles.selectedSongTitle}
                        >
                          {song.title}
                        </AppText>
                        <Pressable
                          accessibilityLabel={`Mover ${song.title} para cima`}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: index === 0 }}
                          disabled={index === 0 || isSubmitting || isDeleting}
                          onPress={() => moveSongBy(song.id, -1)}
                          style={styles.orderButton}
                          testID={`collection-song-up-${song.id}`}
                        >
                          <AppIcon
                            color={
                              index === 0
                                ? colors.text.disabled
                                : colors.text.secondary
                            }
                            name="moveUp"
                            size={16}
                          />
                        </Pressable>
                        <Pressable
                          accessibilityLabel={`Mover ${song.title} para baixo`}
                          accessibilityRole="button"
                          accessibilityState={{
                            disabled: index === selectedSongs.length - 1,
                          }}
                          disabled={
                            index === selectedSongs.length - 1 ||
                            isSubmitting ||
                            isDeleting
                          }
                          onPress={() => moveSongBy(song.id, 1)}
                          style={styles.orderButton}
                          testID={`collection-song-down-${song.id}`}
                        >
                          <AppIcon
                            color={
                              index === selectedSongs.length - 1
                                ? colors.text.disabled
                                : colors.text.secondary
                            }
                            name="moveDown"
                            size={16}
                          />
                        </Pressable>
                        <Pressable
                          accessibilityLabel={`Remover ${song.title} da coleção`}
                          accessibilityRole="button"
                          accessibilityState={{
                            disabled: isSubmitting || isDeleting,
                          }}
                          disabled={isSubmitting || isDeleting}
                          onPress={() => toggleSong(song.id)}
                          style={styles.orderButton}
                          testID={`collection-song-remove-${song.id}`}
                        >
                          <AppIcon
                            color={colors.text.secondary}
                            name="remove"
                            size={18}
                          />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <AppText tone="muted">
                  Nenhuma música escolhida. Você pode salvar a coleção vazia.
                </AppText>
              )}
            </Card>
          </View>
          {initialCollection ? (
            <Card style={styles.dangerZone}>
              <AppText variant="heading">Excluir coleção</AppText>
              <AppText tone="muted">
                Remove a coleção e suas participações. As músicas e os shows
                existentes permanecem no repertório.
              </AppText>
              <AppButton
                accessibilityLabel="Excluir coleção"
                disabled={isSubmitting || isDeleting}
                icon="delete"
                label="Excluir coleção"
                onPress={() => {
                  setDeleteError(null);
                  setDeleteRevisionConflict(false);
                  setDeleteConfirmationVisible(true);
                }}
                variant="destructive"
              />
            </Card>
          ) : null}
          {submitError ? (
            <View style={styles.conflictNotice}>
              <AppText accessibilityRole="alert" style={styles.fieldError}>
                {submitError}
              </AppText>
              {revisionConflict && collectionId ? (
                <AppButton
                  label="Descartar edição e revisar versão atual"
                  onPress={() => {
                    unsavedChanges.allowNextRemoval();
                    router.replace(
                      getRepertoireCollectionHref(bandId, collectionId),
                    );
                  }}
                  variant="secondary"
                />
              ) : null}
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          <AppButton
            disabled={isSubmitting || isDeleting}
            label="Cancelar"
            onPress={requestLeave}
            variant="secondary"
          />
          <AppButton
            accessibilityLabel="Salvar coleção"
            disabled={
              isSubmitting ||
              isDeleting ||
              (Boolean(collectionId) && (!dirty || revisionConflict))
            }
            icon="check"
            label={isSubmitting ? 'Salvando…' : 'Salvar coleção'}
            onPress={() => void handleSave()}
          />
        </View>
      </KeyboardAvoidingView>
      <OptionSheet
        closeAccessibilityLabel="Cancelar exclusão da coleção"
        label="Excluir coleção"
        onClose={() => {
          if (!deletionLock.current) {
            setDeleteError(null);
            setDeleteConfirmationVisible(false);
          }
        }}
        testID="collection-delete-confirmation"
        visible={deleteConfirmationVisible}
      >
        <AppText>
          A coleção e suas participações serão removidas definitivamente. As
          músicas e os shows existentes não serão excluídos.
        </AppText>
        {dirty ? (
          <AppText tone="warning">
            As alterações desta edição também serão descartadas.
          </AppText>
        ) : null}
        {deleteError ? (
          <View style={styles.conflictNotice}>
            <AppText accessibilityRole="alert" style={styles.fieldError}>
              {deleteError}
            </AppText>
            {deleteRevisionConflict && collectionId ? (
              <AppButton
                label="Sair e revisar coleção atual"
                onPress={() => {
                  setDeleteConfirmationVisible(false);
                  unsavedChanges.allowNextRemoval();
                  router.replace(
                    getRepertoireCollectionHref(bandId, collectionId),
                  );
                }}
                variant="secondary"
              />
            ) : null}
          </View>
        ) : null}
        <AppButton
          accessibilityLabel="Cancelar exclusão"
          disabled={isDeleting}
          label="Cancelar"
          onPress={() => setDeleteConfirmationVisible(false)}
          variant="secondary"
        />
        <AppButton
          accessibilityLabel="Confirmar exclusão definitiva da coleção"
          disabled={isDeleting || deleteRevisionConflict}
          icon="delete"
          label={isDeleting ? 'Excluindo…' : 'Excluir definitivamente'}
          onPress={() => void handleDelete()}
          variant="destructive"
        />
      </OptionSheet>
    </RepertoireCollectionEditorFrame>
  );
}

interface CollectionSongDragHandleProps {
  readonly accessibilityLabel: string;
  readonly dragging: boolean;
  readonly onCancel: () => void;
  readonly onEnd: () => void;
  readonly onMove: (translationY: number) => void;
  readonly onStart: () => void;
  readonly testID: string;
}

function CollectionSongDragHandle({
  accessibilityLabel,
  dragging,
  onCancel,
  onEnd,
  onMove,
  onStart,
  testID,
}: CollectionSongDragHandleProps) {
  const callbacksRef = useRef({ onCancel, onEnd, onMove, onStart });
  const dragStartedRef = useRef(false);

  useEffect(() => {
    callbacksRef.current = { onCancel, onEnd, onMove, onStart };
  }, [onCancel, onEnd, onMove, onStart]);

  const startDrag = () => {
    if (dragStartedRef.current) return;
    dragStartedRef.current = true;
    callbacksRef.current.onStart();
  };

  const onGestureEvent = ({ nativeEvent }: PanGestureHandlerGestureEvent) => {
    if (nativeEvent.state !== State.ACTIVE) return;
    startDrag();
    callbacksRef.current.onMove(nativeEvent.translationY);
  };

  const onHandlerStateChange = ({
    nativeEvent,
  }: PanGestureHandlerStateChangeEvent) => {
    if (nativeEvent.state === State.ACTIVE) {
      startDrag();
      return;
    }
    if (!dragStartedRef.current || nativeEvent.oldState !== State.ACTIVE)
      return;

    dragStartedRef.current = false;
    if (nativeEvent.state === State.END) {
      callbacksRef.current.onEnd();
    } else {
      callbacksRef.current.onCancel();
    }
  };

  return (
    <PanGestureHandler
      activeOffsetY={[-4, 4]}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      shouldCancelWhenOutside={false}
      testID={`gesture-${testID}`}
    >
      <View
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        collapsable={false}
        style={styles.dragHandle}
        testID={testID}
      >
        <AppIcon
          color={dragging ? colors.action.primary : colors.text.secondary}
          name="dragHandle"
          size={18}
        />
      </View>
    </PanGestureHandler>
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
    gap: spacing.xs,
    minHeight: layout.minimumTouchTarget,
  },
  selectedSongDragging: {
    backgroundColor: colors.background.raised,
    borderRadius: radii.sm,
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
  dragHandle: {
    alignItems: 'center',
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: 32,
  },
  orderButton: {
    alignItems: 'center',
    borderRadius: radii.sm,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: 36,
  },
  dangerZone: {
    alignSelf: 'center',
    gap: spacing.md,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
  },
  conflictNotice: {
    alignSelf: 'center',
    gap: spacing.md,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
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
