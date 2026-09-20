import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';

import {
  DemoActionNotice,
  ErrorFeedback,
  LoadingFeedback,
} from '@/components/feedback';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { StatusPill } from '@/components/ui/StatusPill';
import { demoIds } from '@/data/demo';
import { useBandMembers, useUserBands } from '@/data/queries';
import {
  BandMemberMutationError,
  removeBandMember,
  updateBandMemberRole,
} from '@/data/supabase/bandMemberMutations';
import type { BandMember, BandRole } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import { getBandSectionHref } from '@/features/navigation/routes';
import {
  type BandSectionScreenProps,
  rememberListScrollOffset,
} from '@/features/navigation/screenTypes';
import { useSectionViewState } from '@/features/navigation/useSectionViewState';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import {
  BandMemberManagementDialog,
  type BandMemberManagementAction,
} from './BandMemberManagementDialog';

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
  const [managedMember, setManagedMember] = useState<BandMember | null>(null);
  const [memberManagementError, setMemberManagementError] = useState<
    string | null
  >(null);
  const [memberManagementSubmitting, setMemberManagementSubmitting] =
    useState(false);
  const isDemoBand =
    bandId === demoIds.primaryBand || bandId === demoIds.secondaryBand;
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

  const openMemberManagement = (member: BandMember) => {
    if (isDemoBand) {
      setPreviewNotice(
        'A administração de integrantes fica disponível ao conectar uma banda real.',
      );
      return;
    }

    setMemberManagementError(null);
    setManagedMember(member);
  };

  const closeMemberManagement = () => {
    if (memberManagementSubmitting) {
      return;
    }

    setManagedMember(null);
    setMemberManagementError(null);
  };

  const handleMemberManagement = async (action: BandMemberManagementAction) => {
    if (!managedMember) {
      return;
    }

    setMemberManagementError(null);
    setMemberManagementSubmitting(true);

    try {
      if (action === 'promote') {
        await updateBandMemberRole({
          bandId,
          memberId: managedMember.id,
          role: 'owner',
        });
      } else {
        await removeBandMember({
          bandId,
          memberId: managedMember.id,
        });
      }

      await Promise.all([membersQuery.refetch(), userBandsQuery.refetch()]);
      setManagedMember(null);
    } catch (error) {
      setMemberManagementError(
        error instanceof BandMemberMutationError
          ? error.message
          : 'Não foi possível atualizar os integrantes agora. Tente novamente.',
      );
    } finally {
      setMemberManagementSubmitting(false);
    }
  };

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
      <DemoActionNotice
        message={previewNotice}
        onClose={() => setPreviewNotice(null)}
      />
      <BandMemberManagementDialog
        errorMessage={memberManagementError}
        isSubmitting={memberManagementSubmitting}
        member={managedMember}
        onClose={closeMemberManagement}
        onConfirm={(action) => void handleMemberManagement(action)}
      />
      <SectionList
        contentContainerStyle={styles.listContent}
        contentOffset={{ x: 0, y: initialScrollOffset }}
        keyExtractor={(member) => member.id}
        onScroll={(event) =>
          rememberListScrollOffset(event, rememberScrollOffset)
        }
        renderItem={({ item }) => (
          <MemberRow
            canManage={canManage}
            current={item.userId === currentMembership?.userId}
            member={item}
            onManage={() => openMemberManagement(item)}
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
    alignSelf: 'flex-start',
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
  pressed: {
    opacity: 0.72,
  },
});
