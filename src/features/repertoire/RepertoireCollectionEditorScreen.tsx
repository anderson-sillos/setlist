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
import { OptionSheet } from '@/components/ui/list-controls/OptionSheet';
import { WebRefreshButton } from '@/components/ui/ScreenDataRefresh';
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
  getRepertoireCollectionAddSongsHref,
  getRepertoireCollectionEditHref,
  getRepertoireCollectionsHref,
  type RepertoireCollectionReturnTo,
} from '@/features/navigation/routes';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import {
  getCollectionSongInsertionIndex,
  moveCollectionSong,
  type CollectionSongLayout,
} from './collectionSongOrder';

interface RepertoireCollectionEditorScreenProps {
  readonly bandId: EntityId;
  readonly collectionId?: EntityId;
  readonly initialSongIds?: readonly EntityId[];
  readonly returnTo?: RepertoireCollectionReturnTo;
  readonly returnToRepertoire?: boolean;
}

interface RepertoireCollectionEditorFrameProps {
  readonly bandId: EntityId;
  readonly children: ReactNode;
  readonly collectionId?: EntityId;
  readonly editActions?: EditActions;
  readonly returnTo: RepertoireCollectionReturnTo;
}

export function RepertoireCollectionEditorScreen({
  bandId,
  collectionId,
  initialSongIds = [],
  returnTo: requestedReturnTo,
  returnToRepertoire = false,
}: RepertoireCollectionEditorScreenProps) {
  const returnTo =
    requestedReturnTo ?? (returnToRepertoire ? 'repertoire' : 'collections');
  const router = useRouter();
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
  const returnHref =
    returnTo === 'repertoire'
      ? getBandSectionHref(bandId, 'repertoire')
      : getRepertoireCollectionsHref(bandId);
  const returnToOrigin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(returnHref);
    }
  };
  const closeCreateDialog = () => {
    returnToOrigin();
  };
  const renderEditorFrame = (children: ReactNode) =>
    collectionId ? (
      <RepertoireCollectionEditorFrame
        bandId={bandId}
        collectionId={collectionId}
        returnTo={returnTo}
      >
        {children}
      </RepertoireCollectionEditorFrame>
    ) : (
      <RepertoireCollectionCreationOverlay onClose={closeCreateDialog}>
        {children}
      </RepertoireCollectionCreationOverlay>
    );

  if (isLoading) {
    return renderEditorFrame(<LoadingFeedback />);
  }

  if (isError) {
    return renderEditorFrame(
      <>
        <ErrorFeedback
          onRetry={() => {
            void collectionsQuery.refetch();
            void songsQuery.refetch();
            void userBandsQuery.refetch();
          }}
        />
        <WebRefreshButton onRefresh={onRefresh} refreshing={refreshing} />
      </>,
    );
  }

  if (!canEdit || (collectionId && !summary)) {
    return renderEditorFrame(
      <UnavailableFeedback title="Seu papel não permite editar coleções ou a coleção está indisponível" />,
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
      returnTo={returnTo}
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
  readonly returnTo: RepertoireCollectionReturnTo;
  readonly songs: readonly Song[];
}

interface CollectionSongDragPreview {
  readonly height: number;
  readonly label: string;
  readonly top: number;
}

function RepertoireCollectionEditorForm({
  bandId,
  collectionId,
  existingCollections,
  initialCollection,
  orderedSongIds,
  returnTo,
  songs,
}: RepertoireCollectionEditorFormProps) {
  const router = useRouter();
  const saveCollection = useSaveRepertoireCollection(bandId);
  const deleteCollection = useDeleteRepertoireCollection(bandId);
  const submissionLock = useRef(false);
  const deletionLock = useRef(false);
  const songLayoutsRef = useRef(new Map<EntityId, CollectionSongLayout>());
  const songSectionOriginYRef = useRef(0);
  const collectionCardOriginYRef = useRef(0);
  const songListLocalYRef = useRef(0);
  const songListOriginYRef = useRef(0);
  const dragSessionRef = useRef<{
    readonly originCenterY: number;
    readonly originTopY: number;
    readonly originScrollOffset: number;
    readonly songId: EntityId;
    targetIndex: number;
  } | null>(null);
  const scrollFrameYRef = useRef(0);
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
  const [dragPreview, setDragPreview] =
    useState<CollectionSongDragPreview | null>(null);
  const [selectedSongIds, setSelectedSongIds] =
    useState<readonly EntityId[]>(orderedSongIds);
  const initialName = initialCollection?.name ?? '';
  const selectionDirty =
    selectedSongIds.length !== orderedSongIds.length ||
    selectedSongIds.some((songId, index) => orderedSongIds[index] !== songId);
  const dirty = name !== initialName || selectionDirty;
  const songsById = useMemo(
    () => new Map(songs.map((song) => [song.id, song])),
    [songs],
  );
  const selectedSongs = selectedSongIds.flatMap((songId) => {
    const song = songsById.get(songId);
    return song ? [song] : [];
  });
  const updateSongListOriginY = () => {
    songListOriginYRef.current =
      songSectionOriginYRef.current +
      collectionCardOriginYRef.current +
      songListLocalYRef.current;
  };
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
    const localLayout = songLayoutsRef.current.get(songId);
    const index = selectedSongIds.indexOf(songId);
    if (!localLayout || index < 0) return;
    const layout = {
      ...localLayout,
      y: songListOriginYRef.current + localLayout.y,
    };

    dragSessionRef.current = {
      originCenterY: layout.y + layout.height / 2,
      originTopY: layout.y,
      originScrollOffset: scrollOffsetRef.current,
      songId,
      targetIndex: index,
    };
    setDraggingSongId(songId);
    setDragPreview({
      height: layout.height,
      label: songsById.get(songId)?.title ?? 'Música indisponível',
      top: scrollFrameYRef.current + layout.y - scrollOffsetRef.current,
    });
  };

  const moveSongDrag = (translationY: number) => {
    const session = dragSessionRef.current;
    if (!session) return;
    const previewTop =
      scrollFrameYRef.current +
      session.originTopY -
      session.originScrollOffset +
      translationY;
    setDragPreview((current) =>
      current ? { ...current, top: previewTop } : current,
    );
    const layouts = selectedSongIds.flatMap((id) => {
      const layout = songLayoutsRef.current.get(id);
      return layout
        ? [{ ...layout, y: songListOriginYRef.current + layout.y }]
        : [];
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
    setDragPreview(null);
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

  const unsavedChanges = useUnsavedChangesGuard({
    dirty,
    saving: isSubmitting || isDeleting,
  });

  const leaveEditor = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(
        returnTo === 'repertoire'
          ? getBandSectionHref(bandId, 'repertoire')
          : getRepertoireCollectionsHref(bandId),
      );
    }
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
      if (!initialCollection) {
        router.replace(
          getRepertoireCollectionEditHref(bandId, savedCollection.id, returnTo),
        );
      } else {
        leaveEditor();
      }
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

  const requestDelete = () => {
    setDeleteError(null);
    setDeleteRevisionConflict(false);
    setDeleteConfirmationVisible(true);
  };

  const editActions: EditActions = {
    onCancel: requestLeave,
    onSave: () => void handleSave(),
    leadingAction: collectionId
      ? {
          accessibilityLabel: 'Voltar da edição da coleção',
          icon: 'back',
          onPress: requestLeave,
        }
      : undefined,
    saveDisabled:
      isSubmitting ||
      isDeleting ||
      (Boolean(collectionId) && (!dirty || revisionConflict)),
    trailingAction: collectionId
      ? {
          accessibilityLabel: 'Excluir coleção',
          color: colors.semantic.danger,
          disabled: isSubmitting || isDeleting,
          icon: 'delete',
          onPress: requestDelete,
        }
      : undefined,
  };

  if (!collectionId) {
    return (
      <RepertoireCollectionCreationOverlay onClose={requestLeave}>
        <UnsavedChangesPrompt
          onContinue={unsavedChanges.continueEditing}
          onDiscard={unsavedChanges.discardAndLeave}
          visible={unsavedChanges.confirmationVisible}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.creationDialogBody}
          testID="collection-editor-keyboard-layout"
        >
          <ScrollView
            contentContainerStyle={styles.creationFormContent}
            keyboardShouldPersistTaps="handled"
            testID="collection-editor-scroll"
          >
            <AppText tone="muted">
              Escolha um nome para a coleção. Inclua músicas pelas ações do
              Repertório.
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
            {selectedSongIds.length > 0 ? (
              <AppText tone="muted" variant="caption">
                {selectedSongIds.length === 1
                  ? '1 música selecionada será incluída.'
                  : `${selectedSongIds.length} músicas selecionadas serão incluídas.`}
              </AppText>
            ) : null}
            {submitError ? (
              <AppText accessibilityRole="alert" style={styles.fieldError}>
                {submitError}
              </AppText>
            ) : null}
          </ScrollView>
          <View style={styles.creationFooter}>
            <AppButton
              disabled={isSubmitting || isDeleting}
              label="Cancelar"
              onPress={requestLeave}
              style={styles.creationActionButton}
              variant="secondary"
            />
            <AppButton
              accessibilityLabel="Salvar coleção"
              disabled={isSubmitting || isDeleting}
              icon="check"
              label={isSubmitting ? 'Salvando…' : 'Salvar coleção'}
              onPress={() => void handleSave()}
              style={styles.creationActionButton}
            />
          </View>
        </KeyboardAvoidingView>
      </RepertoireCollectionCreationOverlay>
    );
  }

  return (
    <RepertoireCollectionEditorFrame
      bandId={bandId}
      collectionId={collectionId}
      editActions={editActions}
      returnTo={returnTo}
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
        <View style={styles.editorBody}>
          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            onLayout={(event) => {
              scrollFrameYRef.current = event.nativeEvent.layout.y;
            }}
            onScroll={(event) => {
              scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            testID="collection-editor-scroll"
          >
            <AppText tone="muted">
              Escolha um nome para a coleção. Inclua músicas pelas ações do
              Repertório.
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
            {!collectionId && selectedSongIds.length > 0 ? (
              <AppText tone="muted" variant="caption">
                {selectedSongIds.length === 1
                  ? '1 música selecionada será incluída.'
                  : `${selectedSongIds.length} músicas selecionadas serão incluídas.`}
              </AppText>
            ) : null}
            {collectionId ? (
              <View
                onLayout={(event) => {
                  songSectionOriginYRef.current = event.nativeEvent.layout.y;
                  updateSongListOriginY();
                }}
                style={styles.songSection}
              >
                <AppButton
                  icon="musicAdd"
                  label="Adicionar músicas"
                  onPress={() => {
                    const openRepertoire = () =>
                      router.replace(
                        getRepertoireCollectionAddSongsHref(
                          bandId,
                          collectionId,
                        ),
                      );
                    if (dirty)
                      unsavedChanges.requestConfirmation(openRepertoire);
                    else openRepertoire();
                  }}
                  variant="secondary"
                />
                <Card
                  onLayout={(event) => {
                    collectionCardOriginYRef.current =
                      event.nativeEvent.layout.y;
                    updateSongListOriginY();
                  }}
                  style={styles.selectionReview}
                >
                  {selectedSongs.length ? (
                    <>
                      <AppText tone="muted" variant="caption">
                        Arraste pela alça para ordenar.
                      </AppText>
                      <View
                        onLayout={(event) => {
                          songListLocalYRef.current =
                            event.nativeEvent.layout.y;
                          updateSongListOriginY();
                        }}
                        style={styles.selectedSongList}
                      >
                        {selectedSongs.map((song, index) => (
                          <View
                            key={song.id}
                            onLayout={(event) =>
                              registerSongLayout(song.id, event)
                            }
                            style={[
                              styles.selectedSongRow,
                              draggingSongId === song.id &&
                                styles.selectedSongDragging,
                            ]}
                            testID={`collection-song-row-${song.id}`}
                          >
                            <CollectionSongRemoveButton
                              disabled={isSubmitting || isDeleting}
                              onPress={() => toggleSong(song.id)}
                              songTitle={song.title}
                              testID={`collection-song-remove-${song.id}`}
                            />
                            <AppIcon
                              color={colors.text.secondary}
                              name="music"
                              size={16}
                            />
                            <AppText
                              style={styles.selectedPosition}
                              tone="muted"
                            >
                              {index + 1}.
                            </AppText>
                            <AppText
                              numberOfLines={2}
                              style={styles.selectedSongTitle}
                            >
                              {song.title}
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
                          </View>
                        ))}
                      </View>
                    </>
                  ) : (
                    <AppText tone="muted">
                      Esta coleção ainda não tem músicas. Adicione pelo
                      Repertório.
                    </AppText>
                  )}
                </Card>
              </View>
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
                        getRepertoireCollectionEditHref(
                          bandId,
                          collectionId,
                          returnTo,
                        ),
                      );
                    }}
                    variant="secondary"
                  />
                ) : null}
              </View>
            ) : null}
          </ScrollView>
          {dragPreview ? (
            <View
              style={[
                styles.dragPreview,
                { height: dragPreview.height, top: dragPreview.top },
              ]}
              testID="collection-song-drag-preview"
            >
              <AppIcon color={colors.action.primary} name="music" size={18} />
              <AppText numberOfLines={1} style={styles.dragPreviewLabel}>
                {dragPreview.label}
              </AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.footer}>
          {collectionId && !dirty ? (
            <AppButton
              disabled={isSubmitting || isDeleting}
              label="Fechar"
              onPress={requestLeave}
              variant="secondary"
            />
          ) : (
            <>
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
            </>
          )}
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
                    getRepertoireCollectionEditHref(
                      bandId,
                      collectionId,
                      returnTo,
                    ),
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

function CollectionSongRemoveButton({
  disabled,
  onPress,
  songTitle,
  testID,
}: {
  readonly disabled: boolean;
  readonly onPress: () => void;
  readonly songTitle: string;
  readonly testID: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityLabel={`Remover ${songTitle} da coleção`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={spacing.sm}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.songRemoveButton,
        focused && styles.focusedIconButton,
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      <AppIcon color={colors.text.secondary} name="delete" size={17} />
    </Pressable>
  );
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
        style={[styles.dragHandle, dragging && styles.draggingHandle]}
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
  returnTo,
}: RepertoireCollectionEditorFrameProps) {
  return (
    <BandAreaLayout
      activeSection="repertoire"
      bandId={bandId}
      currentRoute={
        collectionId
          ? (getRepertoireCollectionEditHref(
              bandId,
              collectionId,
              returnTo,
            ) as string)
          : (getRepertoireCollectionCreateHref(
              bandId,
              [],
              returnTo === 'repertoire',
            ) as string)
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

interface RepertoireCollectionCreationOverlayProps {
  readonly children: ReactNode;
  readonly onClose: () => void;
}

function RepertoireCollectionCreationOverlay({
  children,
  onClose,
}: RepertoireCollectionCreationOverlayProps) {
  return (
    <View style={styles.creationOverlay} testID="collection-create-overlay">
      <Pressable
        accessibilityLabel="Fechar janela de nova coleção"
        accessibilityRole="button"
        onPress={onClose}
        style={styles.creationScrim}
      />
      <View
        accessibilityViewIsModal
        style={styles.creationDialog}
        testID="collection-create-dialog"
      >
        <View style={styles.creationHeader}>
          <AppText accessibilityRole="header" variant="heading">
            Nova coleção
          </AppText>
          <Pressable
            accessibilityLabel="Fechar janela de nova coleção"
            accessibilityRole="button"
            hitSlop={spacing.sm}
            onPress={onClose}
            style={({ pressed }) => [
              styles.creationCloseButton,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon color={colors.text.secondary} name="close" size={20} />
          </Pressable>
        </View>
        <View style={styles.creationDialogContent}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  creationActionButton: {
    flex: 1,
    minWidth: 0,
  },
  creationCloseButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  creationDialog: {
    backgroundColor: colors.background.raised,
    borderRadius: radii.lg,
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#08080a',
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      web: { boxShadow: '0px 4px 16px rgba(23, 32, 51, 0.18)' },
    }),
    height: 360,
    maxHeight: '90%',
    maxWidth: 520,
    minHeight: 280,
    overflow: 'hidden',
    width: '100%',
  },
  creationDialogBody: {
    flex: 1,
    minHeight: 0,
  },
  creationDialogContent: {
    flex: 1,
    minHeight: 0,
  },
  creationFooter: {
    alignItems: 'center',
    backgroundColor: colors.background.raised,
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: spacing.md,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  creationFormContent: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  creationHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  creationOverlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  creationScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background.overlay,
  },
  editor: {
    flex: 1,
    minHeight: 0,
  },
  editorBody: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
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
  pressed: {
    opacity: 0.72,
  },
  songSection: {
    gap: spacing.md,
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: layout.minimumTouchTarget,
  },
  selectedSongDragging: {
    borderColor: colors.action.primary,
    borderRadius: radii.sm,
    borderWidth: 2,
    paddingHorizontal: spacing.xs,
  },
  selectedPosition: {
    fontVariant: ['tabular-nums'],
    minWidth: 24,
    paddingTop: 2,
    textAlign: 'right',
  },
  selectedSongTitle: {
    flex: 1,
    minWidth: 0,
  },
  dragHandle: {
    alignItems: 'center',
    alignSelf: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  draggingHandle: {
    backgroundColor: colors.background.selected,
  },
  dragPreview: {
    alignItems: 'center',
    backgroundColor: colors.background.raised,
    borderColor: colors.action.primary,
    borderRadius: radii.md,
    borderWidth: 2,
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#08080a',
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      web: { boxShadow: '0px 4px 8px rgba(23, 32, 51, 0.18)' },
    }),
    flexDirection: 'row',
    gap: spacing.sm,
    left: spacing.xl,
    opacity: 0.94,
    paddingHorizontal: spacing.md,
    position: 'absolute',
    right: spacing.xl,
    pointerEvents: 'none',
    zIndex: 20,
  },
  dragPreviewLabel: {
    flex: 1,
    minWidth: 0,
  },
  songRemoveButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radii.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  focusedIconButton: {
    borderColor: colors.border.focus,
    borderRadius: radii.pill,
    borderWidth: 2,
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
