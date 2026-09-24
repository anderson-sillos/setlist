import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

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
  | 'headerActions'
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
  headerActions: providedHeaderActions,
  persistentSidebar,
  screenKind,
  subtitle,
  title,
}: AppHeaderProps) {
  const kind = screenKind ?? 'main';
  const headerActions =
    providedHeaderActions ?? (headerAction ? [headerAction] : []);

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
          <HeaderIconButton
            accessibilityLabel={`Voltar para ${subtitle ?? 'a tela anterior'}`}
            icon="back"
            role="link"
          />
        </Link>
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
          color={editActions.saveDisabled ? colors.muted : colors.violet}
          disabled={editActions.saveDisabled}
          icon="check"
          onPress={editActions.onSave}
        />
      ) : null}
      {kind !== 'edit' && headerActions.length > 0 ? (
        <View style={styles.headerActions}>
          {headerActions.map((action) => (
            <HeaderIconButton
              accessibilityLabel={action.accessibilityLabel}
              color={colors.violet}
              icon={action.icon ?? 'more'}
              key={action.accessibilityLabel}
              onPress={action.onPress}
            />
          ))}
        </View>
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
  readonly role?: 'button' | 'link';
}

function HeaderIconButton({
  accessibilityLabel,
  accessibilityState,
  color = colors.ink,
  disabled,
  icon,
  onPress,
  role = 'button',
}: HeaderIconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={role}
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
      {icon ? <AppIcon color={color} name={icon} /> : null}
    </Pressable>
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
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
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
