import { Link } from 'expo-router';
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
import { useShow, useSongs, useUserBands } from '@/data/queries';
import type { EntityId } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  formatDuration,
  formatShowDate,
  getBlockDurationBreakdown,
  getShowDurationBreakdown,
  showStatusLabels,
} from '@/features/navigation/display';
import {
  getBandSectionHref,
  getShowHref,
  getStageHref,
} from '@/features/navigation/routes';
import { getLayoutMode } from '@/theme/responsive';
import { colors, radii, spacing } from '@/theme/tokens';

interface ShowDetailScreenProps {
  readonly bandId: EntityId;
  readonly showId: EntityId;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}

export function ShowDetailScreen({
  bandId,
  showId,
  viewportHeight,
  viewportWidth,
}: ShowDetailScreenProps) {
  const window = useWindowDimensions();
  const layoutMode = getLayoutMode(viewportWidth ?? window.width);
  const showQuery = useShow(bandId, showId);
  const songsQuery = useSongs(bandId, true);
  const userBandsQuery = useUserBands();
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const show = showQuery.data;
  const songsById = useMemo(
    () => new Map((songsQuery.data ?? []).map((song) => [song.id, song])),
    [songsQuery.data],
  );
  const membership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canEdit = membership?.role === 'owner' || membership?.role === 'editor';
  const duration = show ? getShowDurationBreakdown(show, songsById) : null;

  return (
    <BandAreaLayout
      activeSection="shows"
      backHref={getBandSectionHref(bandId, 'shows')}
      bandId={bandId}
      currentRoute={getShowHref(bandId, showId) as string}
      headerAction={
        canEdit
          ? {
              accessibilityLabel: 'Mais opções do show',
              icon: 'more',
              label: 'Mais opções',
              onPress: () =>
                setDemoNotice(
                  'Duplicar e alterar o estado entram no incremento de shows.',
                ),
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
              <View style={styles.statusPill}>
                <AppText tone="accent" variant="caption">
                  {showStatusLabels[show.status]}
                </AppText>
              </View>
            </View>
            <AppText accessibilityRole="header" variant="title">
              {show.name}
            </AppText>
            <AppText tone="muted">{formatShowDate(show.startsAt)}</AppText>
            <AppText>{show.venue}</AppText>

            <View style={styles.durationSummary}>
              <AppText tone="muted" variant="caption">
                Tempo total estimado
              </AppText>
              <AppText variant="heading">
                {duration?.totalMs == null
                  ? 'Duração não informada'
                  : formatDuration(duration.totalMs)}
              </AppText>
              {duration?.totalMs != null ? (
                <AppText tone="muted" variant="caption">
                  Músicas {formatDuration(duration.musicMs)} · Planejamento{' '}
                  {formatDuration(duration.planningMs)}
                </AppText>
              ) : null}
            </View>

            {show.notes ? (
              <View style={styles.notes}>
                <AppText variant="heading">Observações</AppText>
                <AppText>{show.notes}</AppText>
              </View>
            ) : null}

            {canEdit && show.status === 'draft' ? (
              <AppButton
                label="Editar setlist"
                onPress={() =>
                  setDemoNotice(
                    'A edição completa chega no incremento de shows. A permissão já está conferida.',
                  )
                }
              />
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
          </Card>

          <View style={styles.setlist}>
            <AppText accessibilityRole="header" variant="heading">
              Setlist
            </AppText>
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
                        : formatDuration(blockDuration.totalMs)}
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
                          <View style={styles.planningIcon}>
                            <AppIcon
                              color={colors.violet}
                              name="planning"
                              size={18}
                            />
                          </View>
                          <View style={styles.itemCopy}>
                            <AppText tone="accent" variant="caption">
                              Planejamento
                            </AppText>
                            <AppText>{item.description}</AppText>
                          </View>
                          <AppText tone="muted" variant="caption">
                            {item.estimatedDurationMs === null
                              ? '—'
                              : formatDuration(item.estimatedDurationMs)}
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
                            : formatDuration(song.estimatedDurationMs)}
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
  statusPill: {
    backgroundColor: colors.violetSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
  setlist: {
    flex: 1.4,
    gap: spacing.md,
    minWidth: 0,
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
    height: 36,
    justifyContent: 'center',
    width: 36,
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
