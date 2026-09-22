import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
import type { AppIconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { NavigationIconButton } from '@/features/navigation/components/NavigationIconButton';
import type { AppNavigationShellProps } from '@/features/navigation/types';
import { colors, layout, radii, spacing } from '@/theme/tokens';

type AppHeaderProps = Pick<
  AppNavigationShellProps,
  | 'backHref'
  | 'bandName'
  | 'editActions'
  | 'headerAction'
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
  onOpenMenu,
  persistentSidebar,
  screenKind,
  subtitle,
  title,
}: AppHeaderProps) {
  const kind = screenKind ?? 'main';

  return (
    <View style={styles.header} testID="app-header">
      {kind === 'main' && !persistentSidebar ? (
        <NavigationIconButton
          accessibilityLabel="Abrir menu geral"
          icon="menu"
          onPress={onOpenMenu}
        />
      ) : null}

      {kind === 'detail' && backHref ? (
        <Link href={backHref} asChild>
          <Pressable
            accessibilityLabel={`Voltar para ${subtitle ?? 'a tela anterior'}`}
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon name="back" />
          </Pressable>
        </Link>
      ) : null}

      {kind === 'edit' && editActions ? (
        <HeaderButton
          accessibilityLabel="Cancelar edição"
          label="Cancelar"
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
        <HeaderButton
          accessibilityLabel="Salvar edição"
          accessibilityState={{ disabled: editActions.saveDisabled }}
          disabled={editActions.saveDisabled}
          label="Salvar"
          onPress={editActions.onSave}
          variant="primary"
        />
      ) : null}

      {kind !== 'edit' && headerAction ? (
        <HeaderButton
          accessibilityLabel={headerAction.accessibilityLabel}
          icon={headerAction.icon}
          label={headerAction.label}
          onPress={headerAction.onPress}
        />
      ) : null}
    </View>
  );
}

interface HeaderButtonProps {
  readonly accessibilityLabel: string;
  readonly accessibilityState?: {
    readonly disabled?: boolean;
  };
  readonly disabled?: boolean;
  readonly icon?: AppIconName;
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'primary' | 'secondary';
}

function HeaderButton({
  accessibilityLabel,
  accessibilityState,
  disabled,
  icon,
  label,
  onPress,
  variant = 'secondary',
}: HeaderButtonProps) {
  return (
    <AppButton
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={disabled}
      icon={icon}
      label={label}
      onPress={onPress}
      style={styles.headerActionButton}
      variant={variant}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.line,
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
  headerActionButton: {
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
});
