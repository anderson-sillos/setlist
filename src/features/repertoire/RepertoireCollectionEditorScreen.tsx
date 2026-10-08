import { useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
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
import { AppText } from '@/components/ui/AppText';
import { WebRefreshButton } from '@/components/ui/ScreenDataRefresh';
import {
  useSaveRepertoireCollection,
  useRepertoireCollections,
  useUserBands,
} from '@/data/queries';
import type { EntityId, RepertoireCollection } from '@/domain';
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
  const userBandsQuery = useUserBands();
  const { onRefresh, refreshing } = useScreenDataRefresh([
    collectionsQuery,
    userBandsQuery,
  ]);
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';
  const summary = collectionsQuery.data?.find(
    ({ collection }) => collection.id === collectionId,
  );
  const isLoading = collectionsQuery.isPending || userBandsQuery.isPending;
  const isError = collectionsQuery.isError || userBandsQuery.isError;

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
}

function RepertoireCollectionEditorForm({
  bandId,
  collectionId,
  existingCollections,
  initialCollection,
  orderedSongIds,
}: RepertoireCollectionEditorFormProps) {
  const router = useRouter();
  const saveCollection = useSaveRepertoireCollection(bandId);
  const submissionLock = useRef(false);
  const [name, setName] = useState(initialCollection?.name ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialName = initialCollection?.name ?? '';
  const dirty = name !== initialName;
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
        orderedSongIds,
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
