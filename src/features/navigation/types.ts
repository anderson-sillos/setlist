import type { Href } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ConnectionStatus } from '@/components/feedback';
import type { AppIconName } from '@/components/ui/AppIcon';
import type { EntityId } from '@/domain';
import type { BandSection } from '@/features/navigation/routes';

export type NavigationScreenKind = 'main' | 'detail' | 'edit';

export interface HeaderAction {
  readonly accessibilityLabel: string;
  readonly icon?: AppIconName;
  readonly label: string;
  readonly onPress: () => void;
  readonly showLabel?: boolean;
}

export interface EditActions {
  readonly onCancel: () => void;
  readonly onSave: () => void;
  readonly saveDisabled?: boolean;
}

export interface AppNavigationShellProps extends PropsWithChildren {
  readonly activeSection?: BandSection;
  readonly backHref?: Href;
  readonly bandId?: EntityId;
  readonly bandName?: string;
  readonly contentStyle?: StyleProp<ViewStyle>;
  readonly connectionStatus?: ConnectionStatus;
  readonly currentRoute?: string;
  readonly editActions?: EditActions;
  readonly fixedContent?: ReactNode;
  readonly headerAction?: HeaderAction;
  readonly onConnectionRetry?: () => void;
  readonly scrollable?: boolean;
  readonly screenKind?: NavigationScreenKind;
  readonly subtitle?: string;
  readonly testID?: string;
  readonly title: string;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}
