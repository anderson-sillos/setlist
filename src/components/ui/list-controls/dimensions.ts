import { layout, spacing } from '@/theme/tokens';

export const listControlDimensions = {
  borderWidth: 1,
  buttonMinHeight: 40,
  inputMinHeight: layout.minimumTouchTarget,
  searchPadding: spacing.sm,
  toolbarGap: spacing.sm,
  toolbarPaddingBottom: spacing.sm,
} as const;

export const listControlsSearchHeight =
  listControlDimensions.inputMinHeight +
  listControlDimensions.borderWidth * 2 +
  listControlDimensions.searchPadding * 2;

export function getListControlsToolbarHeight(additionalRows = 0): number {
  return (
    listControlDimensions.buttonMinHeight +
    listControlDimensions.toolbarPaddingBottom +
    additionalRows *
      (listControlDimensions.buttonMinHeight + listControlDimensions.toolbarGap)
  );
}

export function getListControlsExpandedHeight(additionalRows = 0): number {
  return (
    listControlsSearchHeight +
    getListControlsToolbarHeight(additionalRows) +
    listControlDimensions.borderWidth
  );
}
