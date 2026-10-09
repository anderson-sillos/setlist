import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import {
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { UnsavedChangesPrompt } from '@/components/feedback/UnsavedChangesPrompt';
import {
  useRepertoireCollections,
  useShow,
  useSongs,
  useUserBands,
} from '@/data/queries';
import {
  createShowBlock,
  deleteShowBlock,
  renameShowBlock,
  reorderShowBlocks,
  replaceShowBlockItems,
  ShowMutationError,
} from '@/data/supabase';
import type { EntityId } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import { useScreenDataRefresh } from '@/hooks/useScreenDataRefresh';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { getShowEditHref, getShowHref } from '@/features/navigation/routes';
import {
  ShowBlockEditorDialog,
  type CollectionPreviewValidationRequest,
  type CollectionPreviewValidationResult,
  type ShowBlockDraft,
} from './ShowBlockEditorDialog';

interface ShowSetlistEditorScreenProps {
  readonly bandId: EntityId;
  readonly showId: EntityId;
}

export function ShowSetlistEditorScreen({
  bandId,
  showId,
}: ShowSetlistEditorScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showQuery = useShow(bandId, showId);
  const songsQuery = useSongs(bandId, true);
  const collectionsQuery = useRepertoireCollections(bandId);
  const userBandsQuery = useUserBands();
  useScreenDataRefresh([userBandsQuery, songsQuery, collectionsQuery]);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const [dirty, setDirty] = useState(false);
  const unsavedChanges = useUnsavedChangesGuard({ dirty, saving: submitting });
  const show = showQuery.data;
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';
  const validateCollectionPreview = async ({
    collectionId,
    expectedSongs,
    expectedUpdatedAt,
  }: CollectionPreviewValidationRequest): Promise<CollectionPreviewValidationResult> => {
    const network = await NetInfo.fetch();
    if (network.isConnected !== true || network.isInternetReachable === false) {
      return {
        message:
          'É necessária uma conexão à internet para confirmar a inclusão da coleção.',
        status: 'unavailable',
      };
    }

    const [freshShow, freshSongs, freshCollections, freshUserBands] =
      await Promise.all([
        showQuery.refetch(),
        songsQuery.refetch(),
        collectionsQuery.refetch(),
        userBandsQuery.refetch(),
      ]);
    if (
      freshShow.isError ||
      freshSongs.isError ||
      freshCollections.isError ||
      freshUserBands.isError ||
      !freshShow.data ||
      !freshSongs.data ||
      !freshCollections.data ||
      !freshUserBands.data
    ) {
      return {
        message:
          'Não foi possível validar o show, as músicas e seu acesso. Verifique a conexão e tente novamente.',
        status: 'unavailable',
      };
    }

    const freshMembership = freshUserBands.data.find(
      ({ band }) => band.id === bandId,
    )?.membership;
    if (
      (freshMembership?.role !== 'owner' &&
        freshMembership?.role !== 'editor') ||
      freshShow.data.status !== 'draft'
    ) {
      return {
        message:
          'O show ou seu acesso mudou. Feche a prévia e reabra o editor para atualizar as permissões.',
        status: 'unavailable',
      };
    }

    const freshCollection = freshCollections.data.find(
      ({ collection }) => collection.id === collectionId,
    );
    if (!freshCollection) {
      return {
        message:
          'A coleção não está mais disponível. Feche a prévia e escolha outra coleção.',
        status: 'unavailable',
      };
    }

    const visibleSongIds = new Set(freshSongs.data.map(({ id }) => id));
    const freshEligibleSongs = freshCollection.songs
      .filter((song) => song.archivedAt === null && visibleSongIds.has(song.id))
      .map(({ estimatedDurationMs, id, originalArtist, title }) => ({
        estimatedDurationMs,
        id,
        originalArtist,
        title,
      }));
    const sameSongPreview =
      freshEligibleSongs.length === expectedSongs.length &&
      freshEligibleSongs.every((song, index) => {
        const expectedSong = expectedSongs[index];
        return (
          expectedSong !== undefined &&
          song.id === expectedSong.id &&
          song.title === expectedSong.title &&
          song.originalArtist === expectedSong.originalArtist &&
          song.estimatedDurationMs === expectedSong.estimatedDurationMs
        );
      });
    if (
      freshCollection.collection.updatedAt !== expectedUpdatedAt ||
      !sameSongPreview
    ) {
      return {
        collection: freshCollection,
        message:
          'A coleção ou suas músicas mudaram desde a prévia. Confira os dados atualizados e confirme novamente.',
        status: 'changed',
      };
    }

    return { collection: freshCollection, status: 'ready' };
  };
  const handleSave = async (drafts: readonly ShowBlockDraft[]) => {
    if (!show || submissionLock.current) return;
    submissionLock.current = true;
    setError(null);
    setSubmitting(true);
    try {
      const draftIds = new Set(
        drafts.filter((draft) => !draft.isNew).map(({ id }) => id),
      );
      const removedBlockIds = show.blocks
        .filter(({ id }) => !draftIds.has(id))
        .map(({ id }) => id);
      const createdBlockIds = new Map<string, EntityId>();
      let createdCount = 0;

      for (const draft of drafts) {
        if (!draft.isNew) continue;
        const createdId = await createShowBlock({
          name: draft.name,
          position: show.blocks.length + createdCount,
          showId: show.id,
        });
        createdBlockIds.set(draft.id, createdId);
        createdCount += 1;
      }

      for (const blockId of removedBlockIds) {
        await deleteShowBlock({ blockId, showId: show.id });
      }

      for (const draft of drafts) {
        if (draft.isNew) continue;
        const currentBlock = show.blocks.find(({ id }) => id === draft.id);
        if (currentBlock && currentBlock.name !== draft.name.trim()) {
          await renameShowBlock({ blockId: draft.id, name: draft.name });
        }
      }

      const resolvedDrafts = drafts.map((draft) => ({
        ...draft,
        id: draft.isNew
          ? (createdBlockIds.get(draft.id) ?? draft.id)
          : draft.id,
      }));
      await reorderShowBlocks({
        blocks: resolvedDrafts.map(({ id, name }) => ({ id, name })),
        showId: show.id,
      });
      await Promise.all(
        resolvedDrafts.map(({ id, items }) =>
          replaceShowBlockItems({ blockId: id, items }),
        ),
      );
      await Promise.all([
        showQuery.refetch(),
        queryClient.invalidateQueries({
          queryKey: ['bands', bandId, 'shows'],
          refetchType: 'all',
        }),
      ]);
      unsavedChanges.allowNextRemoval();
      router.back();
    } catch (saveError) {
      setError(
        saveError instanceof ShowMutationError
          ? saveError.message
          : 'Não foi possível salvar a setlist agora. Tente novamente.',
      );
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  };

  const loading =
    showQuery.isPending ||
    songsQuery.isPending ||
    collectionsQuery.isPending ||
    userBandsQuery.isPending;
  const unavailable =
    !loading &&
    !showQuery.isError &&
    (!show || !canEdit || show.status !== 'draft');

  return (
    <BandAreaLayout
      activeSection="shows"
      backHref={getShowHref(bandId, showId)}
      bandId={bandId}
      contentStyle={{ flex: 1, minHeight: 0 }}
      currentRoute={getShowEditHref(bandId, showId) as string}
      headerAction={
        show && canEdit && show.status === 'draft'
          ? {
              accessibilityLabel: 'Adicionar à setlist',
              icon: 'addCircle',
              label: 'Adicionar item',
              onPress: () => setAddSheetVisible(true),
            }
          : undefined
      }
      screenKind="edit"
      scrollable={false}
      title="Editar setlist"
    >
      {loading ? <LoadingFeedback /> : null}
      {showQuery.isError ||
      songsQuery.isError ||
      collectionsQuery.isError ||
      userBandsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void showQuery.refetch();
            void songsQuery.refetch();
            void collectionsQuery.refetch();
            void userBandsQuery.refetch();
          }}
        />
      ) : null}
      {unavailable ? (
        <UnavailableFeedback
          title={
            show?.status !== 'draft'
              ? 'Este show só pode ser editado enquanto estiver em Rascunho'
              : 'Você não pode editar esta setlist'
          }
        />
      ) : null}
      <UnsavedChangesPrompt
        onContinue={unsavedChanges.continueEditing}
        onDiscard={unsavedChanges.discardAndLeave}
        visible={unsavedChanges.confirmationVisible}
      />
      {show && canEdit && show.status === 'draft' ? (
        <ShowBlockEditorDialog
          addSheetVisible={addSheetVisible}
          errorMessage={error}
          fullScreen
          initialBlocks={show.blocks}
          isSubmitting={submitting}
          collections={collectionsQuery.data ?? []}
          onAddSheetVisibilityChange={setAddSheetVisible}
          onDirtyChange={setDirty}
          onClose={() => router.back()}
          onValidateCollection={validateCollectionPreview}
          onSubmit={(drafts) => void handleSave(drafts)}
          songs={songsQuery.data ?? []}
          visible
        />
      ) : null}
    </BandAreaLayout>
  );
}
