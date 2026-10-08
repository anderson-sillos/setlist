import { forwardRef, type ComponentRef } from 'react';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import type { AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { NavigationIconButton } from '@/features/navigation/components/NavigationIconButton';
import type { AppNavigationShellProps } from '@/features/navigation/types';
import { colors, layout, radii, spacing } from '@/theme/tokens';
import { blurWebFocus } from '@/utils/focus';

type AppHeaderProps = Pick<
  AppNavigationShellProps,
  | 'backHref'
  | 'bandName'
  | 'editActions'
  | 'headerAction'
  | 'leadingHeaderAction'
  | 'screenKind'
  | 'subtitle'
  | 'title'
> & {
  readonly onOpenMenu: () => void;
  readonly persistentSidebar: boolean;
};

export function AppHeader({
  backHref,
  bandName,
  editActions,
  headerAction,
  leadingHeaderAction,
  onOpenMenu,
  persistentSidebar,
  screenKind,
  subtitle,
  title,
}: AppHeaderProps) {
  const kind = screenKind ?? 'main';
  const router = useRouter();

  return (
    <View style={styles.header} testID="app-header">
      {kind === 'main' && leadingHeaderAction ? (
        <HeaderIconButton
          accessibilityLabel={leadingHeaderAction.accessibilityLabel}
          color={colors.text.secondary}
          icon={leadingHeaderAction.icon ?? 'close'}
          onPress={() => {
            blurWebFocus();
            leadingHeaderAction.onPress();
          }}
          size={32}
        />
      ) : kind === 'main' && !persistentSidebar ? (
        <NavigationIconButton
          accessibilityLabel="Abrir menu geral"
          icon="menu"
          onPress={onOpenMenu}
          size={32}
        />
      ) : null}

      {kind === 'detail' && backHref ? (
        <HeaderIconButton
          accessibilityLabel={`Voltar para ${subtitle ?? 'a tela anterior'}`}
          icon="back"
          onPress={() => {
            if (Platform.OS === 'web') {
              router.navigate(backHref);
              return;
            }

            router.replace(backHref);
          }}
          size={32}
        />
      ) : null}

      {kind === 'edit' && editActions ? (
        <HeaderIconButton
          accessibilityLabel="Cancelar edição"
          icon="close"
          onPress={editActions.onCancel}
        />
      ) : null}

      <View style={styles.headerCopy}>
        <AppText accessibilityRole="header" numberOfLines={1} variant="heading">
          {title}
        </AppText>
        {bandName && kind !== 'edit' ? (
          <AppText numberOfLines={1} tone="muted" variant="caption">
            {bandName}
          </AppText>
        ) : null}
      </View>

      {kind === 'edit' && editActions ? (
        <HeaderIconButton
          accessibilityLabel="Salvar edição"
          accessibilityState={{ disabled: editActions.saveDisabled }}
          color={
            editActions.saveDisabled
              ? colors.text.secondary
              : colors.action.primary
          }
          disabled={editActions.saveDisabled}
          icon="check"
          onPress={editActions.onSave}
          size={32}
        />
      ) : null}
      {headerAction ? (
        <HeaderIconButton
          accessibilityLabel={headerAction.accessibilityLabel}
          color={colors.action.primary}
          icon={headerAction.icon ?? 'more'}
          onPress={() => {
            blurWebFocus();
            headerAction.onPress();
          }}
          size={32}
        />
      ) : null}
    </View>
  );
}

interface HeaderIconButtonProps {
  readonly accessibilityLabel: string;
  readonly accessibilityState?: {
    readonly disabled?: boolean;
  };
  readonly color?: string;
  readonly disabled?: boolean;
  readonly icon?: AppIconName;
  readonly onPress?: () => void;
  readonly size?: number;
}

const HeaderIconButton = forwardRef<
  ComponentRef<typeof Pressable>,
  HeaderIconButtonProps
>(function HeaderIconButton(
  {
    accessibilityLabel,
    accessibilityState,
    color = colors.text.primary,
    disabled,
    icon,
    onPress,
    size = 24,
  },
  ref,
) {
  return (
    <Pressable
      ref={ref}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {icon ? <AppIcon color={color} name={icon} size={size} /> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: colors.background.raised,
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    zIndex: 4,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
});
