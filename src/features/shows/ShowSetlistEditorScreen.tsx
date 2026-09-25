import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import {
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { useShow, useSongs, useUserBands } from '@/data/queries';
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
import { getShowEditHref, getShowHref } from '@/features/navigation/routes';
import {
  ShowBlockEditorDialog,
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
  const userBandsQuery = useUserBands();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const show = showQuery.data;
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';
  const handleSave = async (drafts: readonly ShowBlockDraft[]) => {
    if (!show) return;
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
      router.back();
    } catch (saveError) {
      setError(
        saveError instanceof ShowMutationError
          ? saveError.message
          : 'Não foi possível salvar a setlist agora. Tente novamente.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const loading =
    showQuery.isPending || songsQuery.isPending || userBandsQuery.isPending;
  const unavailable =
    !loading &&
    !showQuery.isError &&
    (!show || !canEdit || show.status !== 'draft');

  return (
    <BandAreaLayout
      activeSection="shows"
      backHref={getShowHref(bandId, showId)}
      bandId={bandId}
      currentRoute={getShowEditHref(bandId, showId) as string}
      screenKind="edit"
      scrollable={false}
      title="Editar setlist"
    >
      {loading ? <LoadingFeedback /> : null}
      {showQuery.isError || songsQuery.isError || userBandsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void showQuery.refetch();
            void songsQuery.refetch();
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
      {show && canEdit && show.status === 'draft' ? (
        <ShowBlockEditorDialog
          errorMessage={error}
          fullScreen
          initialBlocks={show.blocks}
          isSubmitting={submitting}
          onClose={() => router.back()}
          onSubmit={(drafts) => void handleSave(drafts)}
          songs={songsQuery.data ?? []}
          visible
        />
      ) : null}
    </BandAreaLayout>
  );
}
