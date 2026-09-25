import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';

import { ErrorFeedback, LoadingFeedback } from '@/components/feedback';
import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { StatusPill } from '@/components/ui/StatusPill';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  useBand,
  useBandInvitations,
  useBandMembers,
  useUserBands,
} from '@/data/queries';
import {
  BandAdministrationError,
  deleteBand,
  updateBandName,
} from '@/data/supabase/bandAdministrationMutations';
import {
  BandMemberMutationError,
  leaveBand,
  removeBandMember,
  updateBandMemberRole,
} from '@/data/supabase/bandMemberMutations';
import {
  createInvitation,
  InvitationMutationError,
  renewInvitation,
  revokeInvitation,
  type CreatedInvitation,
} from '@/data/supabase/invitationMutations';
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
  BandAdministrationDialog,
  type BandAdministrationMode,
} from './BandAdministrationDialog';
import {
  BandMemberManagementDialog,
  type BandMemberManagementAction,
} from './BandMemberManagementDialog';
import { BandInvitationDialog } from './BandInvitationDialog';
import { BandLeaveDialog } from './BandLeaveDialog';
import { useLastBandSelection } from './LastBandSelection';

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const bandQuery = useBand(bandId);
  const membersQuery = useBandMembers(bandId);
  const userBandsQuery = useUserBands();
  const { clearLastBand } = useLastBandSelection();
  const currentMembership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canManage = currentMembership?.role === 'owner';
  const [managedMember, setManagedMember] = useState<BandMember | null>(null);
  const [memberManagementError, setMemberManagementError] = useState<
    string | null
  >(null);
  const [memberManagementSubmitting, setMemberManagementSubmitting] =
    useState(false);
  const [leaveDialogVisible, setLeaveDialogVisible] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [bandAdministrationMode, setBandAdministrationMode] =
    useState<BandAdministrationMode | null>(null);
  const [bandAdministrationError, setBandAdministrationError] = useState<
    string | null
  >(null);
  const [bandAdministrationSubmitting, setBandAdministrationSubmitting] =
    useState(false);
  const [invitationDialogVisible, setInvitationDialogVisible] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const [invitationSubmitting, setInvitationSubmitting] = useState(false);
  const invitationsQuery = useBandInvitations(bandId, canManage);
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

  const openLeaveFlow = () => {
    setLeaveError(null);
    setLeaveDialogVisible(true);
  };

  const closeLeaveDialog = () => {
    if (leaveSubmitting) {
      return;
    }

    setLeaveDialogVisible(false);
    setLeaveError(null);
  };

  const openBandAdministration = () => {
    setBandAdministrationError(null);
    setBandAdministrationMode('rename');
  };

  const openInviteFlow = () => {
    setInvitationError(null);
    setInvitationDialogVisible(true);
  };

  const closeInvitationDialog = () => {
    if (invitationSubmitting) {
      return;
    }

    setInvitationDialogVisible(false);
    setInvitationError(null);
  };

  const handleCreateInvitation = async (
    label: string,
  ): Promise<CreatedInvitation | null> => {
    setInvitationError(null);
    setInvitationSubmitting(true);

    try {
      const created = await createInvitation({ bandId, label });
      await invitationsQuery.refetch();
      return created;
    } catch (error) {
      setInvitationError(
        error instanceof InvitationMutationError
          ? error.message
          : 'Não foi possível criar o convite agora. Tente novamente.',
      );
      return null;
    } finally {
      setInvitationSubmitting(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    setInvitationError(null);
    setInvitationSubmitting(true);

    try {
      await revokeInvitation(invitationId);
      await invitationsQuery.refetch();
    } catch (error) {
      setInvitationError(
        error instanceof InvitationMutationError
          ? error.message
          : 'Não foi possível revogar o convite agora. Tente novamente.',
      );
    } finally {
      setInvitationSubmitting(false);
    }
  };

  const handleRenewInvitation = async (
    invitationId: string,
  ): Promise<CreatedInvitation | null> => {
    setInvitationError(null);
    setInvitationSubmitting(true);

    try {
      const renewed = await renewInvitation({ invitationId });
      await invitationsQuery.refetch();
      return renewed;
    } catch (error) {
      setInvitationError(
        error instanceof InvitationMutationError
          ? error.message
          : 'Não foi possível renovar o convite agora. Tente novamente.',
      );
      return null;
    } finally {
      setInvitationSubmitting(false);
    }
  };

  const closeBandAdministration = () => {
    if (bandAdministrationSubmitting) {
      return;
    }

    setBandAdministrationMode(null);
    setBandAdministrationError(null);
  };

  const handleBandRename = async (name: string) => {
    setBandAdministrationError(null);
    setBandAdministrationSubmitting(true);

    try {
      await updateBandName({ bandId, name });
      await Promise.all([
        bandQuery.refetch(),
        queryClient.invalidateQueries({
          queryKey: ['bands', 'user'],
          refetchType: 'all',
        }),
      ]);
      setBandAdministrationMode(null);
    } catch (error) {
      setBandAdministrationError(
        error instanceof BandAdministrationError
          ? error.message
          : 'Não foi possível atualizar a banda agora. Tente novamente.',
      );
    } finally {
      setBandAdministrationSubmitting(false);
    }
  };

  const handleBandDelete = async () => {
    setBandAdministrationError(null);
    setBandAdministrationSubmitting(true);

    try {
      await deleteBand(bandId);
      queryClient.removeQueries({ queryKey: ['bands', bandId] });
      await queryClient.invalidateQueries({
        queryKey: ['bands', 'user'],
        refetchType: 'all',
      });
      await clearLastBand();
      router.replace('/');
    } catch (error) {
      setBandAdministrationError(
        error instanceof BandAdministrationError
          ? error.message
          : 'Não foi possível excluir a banda agora. Tente novamente.',
      );
    } finally {
      setBandAdministrationSubmitting(false);
    }
  };

  const handleMemberManagement = async (action: BandMemberManagementAction) => {
    if (!managedMember) {
      return;
    }

    setMemberManagementError(null);
    setMemberManagementSubmitting(true);

    try {
      if (action.type === 'set-role') {
        await updateBandMemberRole({
          bandId,
          memberId: managedMember.id,
          role: action.role,
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

  const handleLeaveBand = async () => {
    setLeaveError(null);
    setLeaveSubmitting(true);

    try {
      await leaveBand({ bandId });
      queryClient.removeQueries({ queryKey: ['bands', bandId] });
      await queryClient.invalidateQueries({
        queryKey: ['bands', 'user'],
        refetchType: 'all',
      });
      await clearLastBand();
      router.replace('/');
    } catch (error) {
      setLeaveError(
        error instanceof BandMemberMutationError
          ? error.message
          : 'Não foi possível sair da banda agora. Tente novamente.',
      );
    } finally {
      setLeaveSubmitting(false);
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
              accessibilityLabel: 'Editar banda',
              icon: 'more',
              label: 'Editar banda',
              onPress: openBandAdministration,
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
      <BandMemberManagementDialog
        errorMessage={memberManagementError}
        isSubmitting={memberManagementSubmitting}
        member={managedMember}
        onClose={closeMemberManagement}
        onConfirm={(action) => void handleMemberManagement(action)}
      />
      <BandLeaveDialog
        bandName={bandQuery.data?.name ?? 'esta banda'}
        errorMessage={leaveError}
        isSubmitting={leaveSubmitting}
        onClose={closeLeaveDialog}
        onConfirm={() => void handleLeaveBand()}
        visible={leaveDialogVisible}
      />
      <BandAdministrationDialog
        band={bandQuery.data ?? null}
        errorMessage={bandAdministrationError}
        isSubmitting={bandAdministrationSubmitting}
        key={`${bandQuery.data?.id ?? 'none'}-${bandAdministrationMode ?? 'closed'}`}
        mode={bandAdministrationMode}
        onClose={closeBandAdministration}
        onDelete={() => void handleBandDelete()}
        onModeChange={(mode) => {
          setBandAdministrationError(null);
          setBandAdministrationMode(mode);
        }}
        onRename={(name) => void handleBandRename(name)}
      />
      <BandInvitationDialog
        errorMessage={invitationError}
        invitations={invitationsQuery.data ?? []}
        isSubmitting={invitationSubmitting}
        onClose={closeInvitationDialog}
        onCreate={handleCreateInvitation}
        onRenew={handleRenewInvitation}
        onRevoke={(invitationId) => void handleRevokeInvitation(invitationId)}
        visible={invitationDialogVisible}
      />
      <SectionList
        contentContainerStyle={styles.listContent}
        contentOffset={{ x: 0, y: initialScrollOffset }}
        keyExtractor={(member) => member.id}
        ListHeaderComponent={
          canManage ? (
            <AppButton
              accessibilityLabel="Convidar integrante"
              icon="band"
              label="Convidar"
              onPress={openInviteFlow}
              variant="secondary"
            />
          ) : null
        }
        ListHeaderComponentStyle={styles.listHeader}
        onScroll={(event) =>
          rememberListScrollOffset(event, rememberScrollOffset)
        }
        renderItem={({ item }) => (
          <MemberRow
            canManage={canManage}
            current={item.userId === currentMembership?.userId}
            member={item}
            onLeave={openLeaveFlow}
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
  onLeave,
  onManage,
}: {
  readonly canManage: boolean;
  readonly current: boolean;
  readonly member: BandMember;
  readonly onLeave: () => void;
  readonly onManage: () => void;
}) {
  return (
    <View style={styles.rowFrame}>
      <View style={styles.memberRow}>
        <UserAvatar
          avatarUrl={member.avatarUrl}
          displayName={member.displayName}
        />
        <View style={styles.rowCopy}>
          <View style={styles.rowTitleLine}>
            <AppText>{member.displayName}</AppText>
            {current ? <StatusPill tone="ready">Você</StatusPill> : null}
          </View>
          {member.email ? (
            <AppText tone="muted" variant="caption">
              {member.email}
            </AppText>
          ) : null}
        </View>
        {current ? (
          <Pressable
            accessibilityLabel="Sair da banda"
            accessibilityRole="button"
            onPress={onLeave}
            style={({ pressed }) => [
              styles.overflowButton,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon color={colors.violet} name="logout" />
          </Pressable>
        ) : canManage ? (
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
  listHeader: {
    marginBottom: spacing.md,
  },
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
