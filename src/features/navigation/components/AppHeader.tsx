import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIcon } from '@/components/ui/AppIcon';
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
        <Pressable
          accessibilityLabel="Cancelar edição"
          accessibilityRole="button"
          onPress={editActions.onCancel}
          style={({ pressed }) => [
            styles.headerTextButton,
            pressed && styles.pressed,
          ]}
        >
          <AppText tone="accent">Cancelar</AppText>
        </Pressable>
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
        <Pressable
          accessibilityLabel="Salvar edição"
          accessibilityRole="button"
          accessibilityState={{ disabled: editActions.saveDisabled }}
          disabled={editActions.saveDisabled}
          onPress={editActions.onSave}
          style={({ pressed }) => [
            styles.headerTextButton,
            editActions.saveDisabled && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <AppText tone="accent">Salvar</AppText>
        </Pressable>
      ) : null}

      {kind !== 'edit' && headerAction ? (
        headerAction.showLabel ? (
          <AppButton
            accessibilityLabel={headerAction.accessibilityLabel}
            icon={headerAction.icon}
            label={headerAction.label}
            onPress={headerAction.onPress}
            style={styles.labeledHeaderAction}
            variant="secondary"
          />
        ) : (
          <Pressable
            accessibilityLabel={headerAction.accessibilityLabel}
            accessibilityRole="button"
            onPress={headerAction.onPress}
            style={({ pressed }) => [
              headerAction.icon ? styles.iconButton : styles.headerTextButton,
              pressed && styles.pressed,
            ]}
          >
            {headerAction.icon ? (
              <AppIcon color={colors.violet} name={headerAction.icon} />
            ) : (
              <AppText tone="accent">{headerAction.label}</AppText>
            )}
          </Pressable>
        )
      ) : null}
    </View>
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
  headerTextButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.sm,
  },
  labeledHeaderAction: {
    paddingHorizontal: spacing.md,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
});
