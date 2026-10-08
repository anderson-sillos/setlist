import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import {
  type RepertoireCollectionSummary,
  useSetSongRepertoireCollections,
} from '@/data/queries';
import type { EntityId, Song } from '@/domain';
import { RepertoireCollectionError } from '@/domain';
import { getRepertoireCollectionCreateHref } from '@/features/navigation/routes';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

interface MembershipOptions {
  readonly bandId: EntityId;
  readonly canEdit: boolean;
  readonly collections: readonly RepertoireCollectionSummary[];
}

/** Shared membership editor for the song detail and its repertoire actions. */
export function useSongCollectionMembership({
  bandId,
  canEdit,
  collections,
}: MembershipOptions) {
  const router = useRouter();
  const mutation = useSetSongRepertoireCollections(bandId);
  const [song, setSong] = useState<Pick<Song, 'id' | 'title'> | null>(null);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<EntityId>>(
    () => new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const pendingCreateAction = useRef<(() => void) | null>(null);
  const [initialIds, setInitialIds] = useState<ReadonlySet<EntityId>>(
    () => new Set(),
  );
  const revisions = useRef<Readonly<Record<EntityId, string>>>({});
  const dirty =
    selectedIds.size !== initialIds.size ||
    Array.from(selectedIds).some((id) => !initialIds.has(id));
  const guard = useUnsavedChangesGuard({
    dirty: song !== null && dirty,
    saving,
  });
  const finishPendingCreate = useCallback(() => {
    const action = pendingCreateAction.current;
    pendingCreateAction.current = null;
    action?.();
  }, []);

  useEffect(() => {
    if (song !== null || Platform.OS === 'ios') return;
    finishPendingCreate();
  }, [finishPendingCreate, song]);

  const open = (target: Pick<Song, 'id' | 'title'>) => {
    if (!canEdit || lock.current) return;
    const ids = new Set(
      collections
        .filter(({ songs }) => songs.some(({ id }) => id === target.id))
        .map(({ collection }) => collection.id),
    );
    revisions.current = Object.fromEntries(
      collections.map(({ collection }) => [
        collection.id,
        collection.updatedAt,
      ]),
    );
    setInitialIds(ids);
    setSelectedIds(new Set(ids));
    setError(null);
    setSaved(false);
    setSong(target);
  };
  const dismiss = () => {
    if (lock.current) return;
    setSong(null);
    setSelectedIds(new Set(initialIds));
    setError(null);
  };
  const close = () => {
    if (lock.current) return;
    if (dirty) {
      guard.requestConfirmation(dismiss);
    } else {
      dismiss();
    }
  };
  const createCollection = () => {
    if (!song || !canEdit || lock.current) return;
    const create = () => {
      const songId = song.id;
      pendingCreateAction.current = () =>
        router.push(getRepertoireCollectionCreateHref(bandId, [songId], true));
      dismiss();
    };
    if (dirty) guard.requestConfirmation(create);
    else create();
  };
  const toggle = (id: EntityId) => {
    if (lock.current) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setError(null);
  };
  const save = async () => {
    if (!song || !canEdit || !dirty || lock.current) return;
    const affectedIds = new Set([...initialIds, ...selectedIds]);
    const expectedRevisions = Object.fromEntries(
      Object.entries(revisions.current).filter(([id]) => affectedIds.has(id)),
    );
    lock.current = true;
    setSaving(true);
    setError(null);
    try {
      await mutation.mutateAsync({
        songId: song.id,
        collectionIds: Array.from(selectedIds),
        expectedRevisions,
      });
      setSong(null);
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof RepertoireCollectionError
          ? cause.message
          : 'Não foi possível atualizar as coleções agora. Tente novamente.',
      );
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };

  return {
    open,
    guard,
    saved,
    dismissSaved: () => setSaved(false),
    dialogProps: {
      collections: collections.map(({ collection }) => collection),
      errorMessage: error,
      isSaving: saving,
      onClose: close,
      onCreateCollection: createCollection,
      onDismiss: finishPendingCreate,
      onSave: () => void save(),
      onToggle: toggle,
      selectedCollectionIds: selectedIds,
      saveDisabled: !dirty,
      songTitle: song?.title ?? 'Música',
      visible: song !== null,
    },
  };
}
