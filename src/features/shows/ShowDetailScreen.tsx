import { Link, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  DemoActionNotice,
  ErrorFeedback,
  LoadingFeedback,
  UnavailableFeedback,
} from '@/components/feedback';
import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { useShow, useSongs, useUserBands } from '@/data/queries';
import {
  duplicateShow,
  ShowMutationError,
} from '@/data/supabase/showMutations';
import { updateShow } from '@/data/supabase/showUpdateMutations';
import type { EntityId } from '@/domain';
import {
  getBlockDurationBreakdown,
  getShowDurationBreakdown,
} from '@/domain/setlistDuration';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  getBandSectionHref,
  getShowHref,
  getStageHref,
} from '@/features/navigation/routes';
import { getLayoutMode } from '@/theme/responsive';
import { colors, radii, spacing } from '@/theme/tokens';
import { formatShowListDate } from '@/utils/dateTime';
import { formatShowDuration, formatSongDuration } from '@/utils/duration';
import { showStatusLabels } from './showPresentation';
import {
  ShowCreationDialog,
  type ShowCreationForm,
} from './ShowCreationDialog';

interface ShowDetailScreenProps {
  readonly bandId: EntityId;
  readonly showId: EntityId;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}

function toEditForm(show: {
  readonly name: string;
  readonly notes: string | null;
  readonly startsAt: string;
  readonly venue: string;
}): Partial<ShowCreationForm> {
  const date = new Date(show.startsAt);
  const dateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  const time = [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join(':');
  return {
    date: dateKey,
    name: show.name,
    notes: show.notes ?? '',
    time,
    venue: show.venue,
  };
}

export function ShowDetailScreen({
  bandId,
  showId,
  viewportHeight,
  viewportWidth,
}: ShowDetailScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const window = useWindowDimensions();
  const layoutMode = getLayoutMode(viewportWidth ?? window.width);
  const showQuery = useShow(bandId, showId);
  const songsQuery = useSongs(bandId, true);
  const userBandsQuery = useUserBands();
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editInstance, setEditInstance] = useState(0);
  const [duplicateVisible, setDuplicateVisible] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [duplicateSubmitting, setDuplicateSubmitting] = useState(false);
  const [duplicateInstance, setDuplicateInstance] = useState(0);
  const show = showQuery.data;
  const editInitialValues = useMemo(
    () => (show ? toEditForm(show) : undefined),
    [show],
  );
  const duplicateInitialValues = useMemo(() => {
    if (!show) return undefined;

    const values = toEditForm(show);
    const suffix = ' (cópia)';
    const baseName = show.name.slice(0, 200 - suffix.length).trimEnd();
    return { ...values, name: baseName + suffix };
  }, [show]);
  const songsById = useMemo(
    () => new Map((songsQuery.data ?? []).map((song) => [song.id, song])),
    [songsQuery.data],
  );
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';
  const duration = show ? getShowDurationBreakdown(show, songsById) : null;
  const songCount =
    show?.blocks.reduce(
      (total, block) =>
        total + block.items.filter((item) => item.type === 'song').length,
      0,
    ) ?? 0;
  const songCountLabel = `${songCount} ${songCount === 1 ? 'música' : 'músicas'}`;

  const handleUpdateShow = async (form: ShowCreationForm) => {
    if (!show) return;
    setEditError(null);
    setEditSubmitting(true);
    try {
      await updateShow({
        bandId,
        name: form.name,
        notes: form.notes,
        showId: show.id,
        startsAt: form.date + 'T' + form.time + ':00',
        venue: form.venue,
      });
      await Promise.all([
        showQuery.refetch(),
        queryClient.invalidateQueries({
          queryKey: ['bands', bandId, 'shows'],
          refetchType: 'all',
        }),
      ]);
      setEditVisible(false);
    } catch (error) {
      setEditError(
        error instanceof ShowMutationError
          ? error.message
          : 'Não foi possível atualizar o show agora. Tente novamente.',
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDuplicateShow = async (form: ShowCreationForm) => {
    if (!show) return;
    setDuplicateError(null);
    setDuplicateSubmitting(true);
    try {
      const duplicatedShowId = await duplicateShow({
        bandId,
        name: form.name,
        notes: form.notes,
        show,
        startsAt: form.date + 'T' + form.time + ':00',
        venue: form.venue,
      });
      await queryClient.invalidateQueries({
        queryKey: ['bands', bandId, 'shows'],
        refetchType: 'all',
      });
      setDuplicateVisible(false);
      router.push(getShowHref(bandId, duplicatedShowId));
    } catch (error) {
      setDuplicateError(
        error instanceof ShowMutationError
          ? error.message
          : 'Não foi possível duplicar o show agora. Tente novamente.',
      );
    } finally {
      setDuplicateSubmitting(false);
    }
  };

  return (
    <BandAreaLayout
      activeSection="shows"
      backHref={getBandSectionHref(bandId, 'shows')}
      bandId={bandId}
      currentRoute={getShowHref(bandId, showId) as string}
      headerAction={
        canEdit
          ? {
              accessibilityLabel: 'Editar show',
              icon: 'edit',
              label: 'Editar show',
              onPress: () => {
                setEditError(null);
                setEditInstance((current) => current + 1);
                setEditVisible(true);
              },
            }
          : undefined
      }
      screenKind="detail"
      title="Detalhes do show"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      {showQuery.isPending ||
      songsQuery.isPending ||
      userBandsQuery.isPending ? (
        <LoadingFeedback variation={1} />
      ) : null}
      <ShowCreationDialog
        key={`${show?.updatedAt ?? showId}-${editInstance}`}
        description="Atualize os dados de planejamento do show. O setlist permanece intacto."
        errorMessage={editError}
        initialValues={editInitialValues}
        isSubmitting={editSubmitting}
        onClose={() => {
          if (!editSubmitting) {
            setEditVisible(false);
            setEditError(null);
          }
        }}
        onSubmit={(form) => void handleUpdateShow(form)}
        submitLabel="Salvar alterações"
        title="Editar show"
        visible={editVisible}
      />

      <ShowCreationDialog
        key={`${show?.updatedAt ?? showId}-duplicate-${duplicateInstance}`}
        description="Crie um novo Rascunho com os blocos, músicas e anotações deste show."
        errorMessage={duplicateError}
        initialValues={duplicateInitialValues}
        isSubmitting={duplicateSubmitting}
        onClose={() => {
          if (!duplicateSubmitting) {
            setDuplicateVisible(false);
            setDuplicateError(null);
          }
        }}
        onSubmit={(form) => void handleDuplicateShow(form)}
        submitLabel="Duplicar show"
        title="Duplicar show"
        visible={duplicateVisible}
      />
      {showQuery.isError || songsQuery.isError || userBandsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void showQuery.refetch();
            void songsQuery.refetch();
            void userBandsQuery.refetch();
          }}
        />
      ) : null}
      {!showQuery.isPending && !showQuery.isError && !show ? (
        <UnavailableFeedback title="Show indisponível" />
      ) : null}

      <DemoActionNotice
        message={demoNotice}
        onClose={() => setDemoNotice(null)}
      />

      {show ? (
        <View
          style={[styles.detail, layoutMode !== 'phone' && styles.detailWide]}
          testID={`show-detail-${layoutMode}`}
        >
          <Card style={styles.showSummary}>
            <View style={styles.summaryLine}>
              <StatusPill tone={show.status === 'ready' ? 'ready' : 'default'}>
                {showStatusLabels[show.status]}
              </StatusPill>
            </View>
            <AppText accessibilityRole="header" variant="title">
              {show.name}
            </AppText>
            <AppText tone="muted">{formatShowListDate(show.startsAt)}</AppText>
            <AppText>{show.venue}</AppText>

            <View style={styles.durationSummary}>
              <View style={styles.durationHeading}>
                <View style={styles.durationCopy}>
                  <AppText tone="muted" variant="caption">
                    Tempo total estimado
                  </AppText>
                  <AppText variant="heading">
                    {duration?.totalMs == null
                      ? 'Duração não informada'
                      : formatShowDuration(duration.totalMs)}
                  </AppText>
                </View>
                <View
                  accessibilityLabel={`${songCountLabel} no setlist`}
                  accessible
                  style={styles.songCount}
                >
                  <AppIcon color={colors.violet} name="music" size={16} />
                  <AppText tone="accent" variant="caption">
                    {songCountLabel}
                  </AppText>
                </View>
              </View>
              {duration?.totalMs != null ? (
                <AppText tone="muted" variant="caption">
                  Músicas {formatShowDuration(duration.musicMs)} · Planejamento{' '}
                  {formatShowDuration(duration.planningMs)}
                </AppText>
              ) : null}
            </View>

            {show.notes ? (
              <View style={styles.notes}>
                <AppText variant="heading">Observações</AppText>
                <AppText>{show.notes}</AppText>
              </View>
            ) : null}

            {show.status !== 'cancelled' ? (
              <Link href={getStageHref(bandId, show.id)} asChild>
                <Pressable
                  accessibilityLabel="Abrir modo palco"
                  accessibilityRole="link"
                  style={({ pressed }) => [
                    styles.stageLink,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText tone="inverse">Abrir modo palco</AppText>
                </Pressable>
              </Link>
            ) : null}
            {canEdit ? (
              <AppButton
                accessibilityLabel="Duplicar show"
                disabled={duplicateSubmitting}
                icon="copy"
                label="Duplicar show"
                onPress={() => {
                  setDuplicateError(null);
                  setDuplicateInstance((current) => current + 1);
                  setDuplicateVisible(true);
                }}
                variant="secondary"
              />
            ) : null}
          </Card>

          <View style={styles.setlist}>
            <View style={styles.setlistHeader} testID="show-setlist-header">
              <AppText accessibilityRole="header" variant="heading">
                Setlist
              </AppText>
              {canEdit && show.status === 'draft' ? (
                <AppButton
                  accessibilityLabel="Editar setlist"
                  icon="edit"
                  label="Editar"
                  onPress={() =>
                    setDemoNotice(
                      'A edição completa chega no incremento de shows. A permissão já está conferida.',
                    )
                  }
                  style={styles.editSetlistButton}
                  variant="secondary"
                />
              ) : null}
            </View>
            {show.blocks.map((block) => {
              const blockDuration = getBlockDurationBreakdown(block, songsById);

              return (
                <Card key={block.id} style={styles.blockCard}>
                  <View style={styles.blockHeader}>
                    <AppText tone="accent" variant="eyebrow">
                      {block.name}
                    </AppText>
                    <AppText tone="muted" variant="caption">
                      {blockDuration.totalMs === null
                        ? '—'
                        : formatShowDuration(blockDuration.totalMs)}
                    </AppText>
                  </View>
                  {block.items.map((item, index) => {
                    if (item.type === 'separator') {
                      return (
                        <View
                          accessibilityLabel="Separador visual"
                          key={item.id}
                          style={styles.separatorItem}
                        />
                      );
                    }

                    if (item.type === 'planning') {
                      return (
                        <View key={item.id} style={styles.planningItem}>
                          <View
                            accessibilityLabel="Anotação de planejamento"
                            accessibilityRole="image"
                            accessible
                            style={styles.planningIcon}
                          >
                            <AppIcon
                              color={colors.violet}
                              name="planning"
                              size={14}
                            />
                          </View>
                          <View style={styles.itemCopy}>
                            <AppText>{item.description}</AppText>
                          </View>
                          <AppText tone="muted" variant="caption">
                            {item.estimatedDurationMs === null
                              ? '—'
                              : formatSongDuration(item.estimatedDurationMs)}
                          </AppText>
                        </View>
                      );
                    }

                    const song = songsById.get(item.songId);

                    return (
                      <View key={item.id} style={styles.setlistItem}>
                        <AppText style={styles.itemNumber} tone="muted">
                          {index + 1}.
                        </AppText>
                        <View style={styles.itemCopy}>
                          <AppText>
                            {song?.title ?? 'Música indisponível'}
                          </AppText>
                          {item.notes ? (
                            <AppText tone="muted" variant="caption">
                              {item.notes}
                            </AppText>
                          ) : null}
                        </View>
                        <AppText tone="muted" variant="caption">
                          {song?.estimatedDurationMs == null
                            ? '—'
                            : formatSongDuration(song.estimatedDurationMs)}
                        </AppText>
                      </View>
                    );
                  })}
                </Card>
              );
            })}
          </View>
        </View>
      ) : null}
    </BandAreaLayout>
  );
}

const styles = StyleSheet.create({
  detail: {
    gap: spacing.lg,
  },
  detailWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  summaryLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  notes: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  showSummary: {
    flex: 1,
    gap: spacing.md,
    minWidth: 0,
  },
  durationSummary: {
    backgroundColor: colors.cyanSoft,
    borderRadius: radii.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  durationCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  durationHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  songCount: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  setlist: {
    flex: 1.4,
    gap: spacing.md,
    minWidth: 0,
  },
  setlistHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  editSetlistButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  blockCard: {
    gap: spacing.md,
  },
  blockHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  setlistItem: {
    alignItems: 'flex-start',
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  planningItem: {
    alignItems: 'center',
    backgroundColor: colors.cyanSoft,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  planningIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  separatorItem: {
    borderTopColor: colors.violet,
    borderTopWidth: 2,
    marginVertical: spacing.sm,
    opacity: 0.42,
  },
  itemNumber: {
    width: 24,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  stageLink: {
    alignItems: 'center',
    backgroundColor: colors.violet,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
});
