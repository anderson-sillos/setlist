import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';

import { ErrorFeedback, LoadingFeedback } from '@/components/feedback';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { StatusPill } from '@/components/ui/StatusPill';
import { useBandMembers, useUserBands } from '@/data/queries';
import type { BandMember, BandRole } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import { getBandSectionHref } from '@/features/navigation/routes';
import {
  type BandSectionScreenProps,
  rememberListScrollOffset,
} from '@/features/navigation/screenTypes';
import { useSectionViewState } from '@/features/navigation/useSectionViewState';
import { colors, layout, radii, spacing } from '@/theme/tokens';

const roleLabels: Record<BandRole, string> = {
  editor: 'Editor',
  member: 'Integrante',
  owner: 'Proprietário',
};

const roleGroupLabels: Record<BandRole, string> = {
  editor: 'Editores',
  member: 'Integrantes',
  owner: 'Proprietários',
};

export function BandScreen({
  bandId,
  viewportHeight,
  viewportWidth,
}: BandSectionScreenProps) {
  const membersQuery = useBandMembers(bandId);
  const userBandsQuery = useUserBands();
  const currentMembership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canManage = currentMembership?.role === 'owner';
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);
  const { initialScrollOffset, rememberScrollOffset } = useSectionViewState(
    bandId,
    'band',
    { view: 'members' },
  );
  const sections = useMemo(
    () =>
      (['owner', 'editor', 'member'] as const).map((role) => ({
        data: [...(membersQuery.data ?? [])]
          .filter((member) => member.role === role)
          .sort((left, right) =>
            left.displayName.localeCompare(right.displayName, 'pt-BR'),
          ),
        role,
        title: roleGroupLabels[role],
      })),
    [membersQuery.data],
  );

  return (
    <BandAreaLayout
      activeSection="band"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'band') as string}
      headerAction={
        canManage
          ? {
              accessibilityLabel: 'Convidar integrante',
              label: 'Convidar',
              onPress: () =>
                setPreviewNotice(
                  'Os convites entram com o controle de acesso. A posição do botão já está no palco.',
                ),
            }
          : undefined
      }
      scrollable={false}
      title="Banda"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      {membersQuery.isPending || userBandsQuery.isPending ? (
        <LoadingFeedback />
      ) : null}
      {membersQuery.isError || userBandsQuery.isError ? (
        <ErrorFeedback
          onRetry={() => {
            void membersQuery.refetch();
            void userBandsQuery.refetch();
          }}
        />
      ) : null}
      <SectionList
        contentContainerStyle={styles.listContent}
        contentOffset={{ x: 0, y: initialScrollOffset }}
        keyExtractor={(member) => member.id}
        ListHeaderComponent={
          previewNotice ? (
            <View accessibilityLiveRegion="polite" style={styles.demoNotice}>
              <AppText>{previewNotice}</AppText>
              <Pressable
                accessibilityLabel="Fechar aviso de demonstração"
                accessibilityRole="button"
                onPress={() => setPreviewNotice(null)}
              >
                <AppText tone="accent">Fechar</AppText>
              </Pressable>
            </View>
          ) : null
        }
        onScroll={(event) =>
          rememberListScrollOffset(event, rememberScrollOffset)
        }
        renderItem={({ item }) => (
          <MemberRow
            canManage={canManage}
            current={item.userId === currentMembership?.userId}
            member={item}
            onManage={() =>
              setPreviewNotice(
                'A administração de integrantes será conectada ao backend em um próximo incremento.',
              )
            }
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.groupHeader}>
            <AppText tone="accent" variant="eyebrow">
              {section.title} · {section.data.length}
            </AppText>
          </View>
        )}
        scrollEventThrottle={120}
        sections={sections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled
        testID="band-members-list"
      />
    </BandAreaLayout>
  );
}

function MemberRow({
  canManage,
  current,
  member,
  onManage,
}: {
  readonly canManage: boolean;
  readonly current: boolean;
  readonly member: BandMember;
  readonly onManage: () => void;
}) {
  const initials = member.displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR');

  return (
    <View style={styles.rowFrame}>
      <View style={styles.memberRow}>
        <View style={styles.memberAvatar}>
          <AppText tone="accent" variant="caption">
            {initials}
          </AppText>
        </View>
        <View style={styles.rowCopy}>
          <View style={styles.rowTitleLine}>
            <AppText>{member.displayName}</AppText>
            {current ? <StatusPill tone="ready">Você</StatusPill> : null}
          </View>
          <AppText tone="muted" variant="caption">
            {roleLabels[member.role]}
          </AppText>
        </View>
        {canManage && !current ? (
          <Pressable
            accessibilityLabel={`Administrar ${member.displayName}`}
            accessibilityRole="button"
            onPress={onManage}
            style={({ pressed }) => [
              styles.overflowButton,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon color={colors.violet} name="more" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  rowFrame: {
    alignSelf: 'flex-start',
    maxWidth: layout.contentMaxWidth,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  rowTitleLine: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  groupHeader: {
    alignSelf: 'center',
    backgroundColor: colors.paper,
    maxWidth: layout.contentMaxWidth,
    paddingBottom: spacing.sm,
    paddingTop: spacing.lg,
    width: '100%',
  },
  memberRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 68,
    padding: spacing.md,
  },
  memberAvatar: {
    alignItems: 'center',
    backgroundColor: colors.violetSoft,
    borderRadius: radii.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  overflowButton: {
    alignItems: 'center',
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  demoNotice: {
    alignItems: 'center',
    backgroundColor: colors.cyanSoft,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
});
