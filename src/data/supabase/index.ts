export {
  createConfiguredSupabaseClient,
  getSupabaseClient,
} from '@/data/supabase/client';
export {
  AccountDeletionError,
  deleteAccount,
} from '@/data/supabase/accountMutations';
export {
  BandMemberMutationError,
  leaveBand,
  removeBandMember,
  updateBandMemberRole,
} from '@/data/supabase/bandMemberMutations';
export {
  BandAdministrationError,
  deleteBand,
  updateBandName,
} from '@/data/supabase/bandAdministrationMutations';
export { BandCreationError, createBand } from '@/data/supabase/bandMutations';
export {
  InvitationMutationError,
  acceptInvitation,
  createInvitation,
  getInvitationPreview,
  listInvitations,
  renewInvitation,
  revokeInvitation,
} from '@/data/supabase/invitationMutations';
export {
  createSupabaseBandRepository,
  SupabaseBandRepository,
} from '@/data/supabase/repositories';
export {
  createSupabaseSongRepository,
  SupabaseSongRepository,
} from '@/data/supabase/songRepository';
export {
  createSupabaseShowRepository,
  SupabaseShowRepository,
} from '@/data/supabase/showRepository';
export {
  createShow,
  duplicateShow,
  ShowMutationError,
} from '@/data/supabase/showMutations';
export type {
  CreateShowInput,
  DuplicateShowInput,
  ShowMutationErrorCode,
} from '@/data/supabase/showMutations';
export {
  updateShow,
  updateShowStatus,
} from '@/data/supabase/showUpdateMutations';
export type {
  UpdateShowInput,
  UpdateShowStatusInput,
} from '@/data/supabase/showUpdateMutations';
export {
  acceptCurrentBandTerm,
  getCurrentBandTermAcceptance,
  LegalTermMutationError,
} from '@/data/supabase/legalTermMutations';
export type { LegalTermMutationErrorCode } from '@/data/supabase/legalTermMutations';

export {
  createSong,
  SongMutationError,
  updateSong,
} from '@/data/supabase/songMutations';
export {
  archiveSong,
  removeSong,
  restoreSong,
  SongLifecycleMutationError,
} from '@/data/supabase/songLifecycleMutations';
export {
  getUserProfile,
  ProfileMutationError,
  updateMyDisplayName,
} from '@/data/supabase/profileMutations';
export type {
  BandCreationErrorCode,
  CreateBandInput,
} from '@/data/supabase/bandMutations';
export type { AccountDeletionErrorCode } from '@/data/supabase/accountMutations';
export type {
  BandMemberMutationErrorCode,
  LeaveBandInput,
  RemoveBandMemberInput,
  UpdateBandMemberRoleInput,
} from '@/data/supabase/bandMemberMutations';
export type { BandAdministrationErrorCode } from '@/data/supabase/bandAdministrationMutations';
export type {
  SongMutationErrorCode,
  SongWriteInput,
} from '@/data/supabase/songMutations';
export type {
  SongLifecycleErrorCode,
  SongRemovalResult,
} from '@/data/supabase/songLifecycleMutations';
export type {
  CreateInvitationInput,
  CreatedInvitation,
  InvitationMutationErrorCode,
  InvitationPreview,
} from '@/data/supabase/invitationMutations';
export type {
  ProfileErrorCode,
  UserProfile,
} from '@/data/supabase/profileMutations';

export {
  createShowBlock,
  renameShowBlock,
  reorderShowBlocks,
} from '@/data/supabase/showBlockMutations';
export type {
  CreateShowBlockInput,
  ShowBlockDraft,
} from '@/data/supabase/showBlockMutations';
export { replaceShowBlockItems } from '@/data/supabase/showSetlistMutations';
