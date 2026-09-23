import { StyleSheet, View } from 'react-native';

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Ellipsis,
  ExternalLink,
  Hourglass,
  HourglassCog,
  LayoutGrid,
  ListFilter,
  LogIn,
  LogOut,
  Menu,
  Minus,
  Music,
  Music2,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react-native';

import { colors } from '@/theme/tokens';

const iconComponents = {
  add: Plus,
  addCircle: CirclePlus,
  account: UserRound,
  moveDown: ArrowDown,
  moveUp: ArrowUp,
  back: ChevronLeft,
  band: Users,
  bands: LayoutGrid,
  check: Check,
  chevronDown: ChevronDown,
  close: X,
  duration: Hourglass,
  edit: Pencil,
  event: CalendarCheck,
  externalLink: ExternalLink,
  filter: ListFilter,
  forward: ChevronRight,
  login: LogIn,
  logout: LogOut,
  menu: Menu,
  minus: Minus,
  more: Ellipsis,
  music: Music2,
  planning: HourglassCog,
  repertoire: Music,
  search: Search,
  shows: CalendarDays,
  showAdd: CalendarPlus,
  stage: Play,
  sort: ArrowUpDown,
  remove: Trash2,
} satisfies Record<string, LucideIcon>;

const composedIconComponents = {
  bandAdd: Users,
  musicAdd: Music2,
} satisfies Record<string, LucideIcon>;

export type AppIconName =
  keyof typeof iconComponents | keyof typeof composedIconComponents;

interface AppIconProps {
  readonly color?: string;
  readonly name: AppIconName;
  readonly size?: number;
  readonly strokeWidth?: number;
}

export function AppIcon({
  color = colors.ink,
  name,
  size = 24,
  strokeWidth = 2,
}: AppIconProps) {
  const ComposedIcon =
    composedIconComponents[name as keyof typeof composedIconComponents];

  if (ComposedIcon) {
    const badgeSize = Math.max(12, size * 0.56);

    return (
      <View
        pointerEvents="none"
        style={[styles.composedIcon, { height: size, width: size }]}
      >
        <ComposedIcon
          color={color}
          height={size}
          size={size}
          strokeWidth={strokeWidth}
          width={size}
        />
        <View
          style={[
            styles.composedBadge,
            {
              borderRadius: badgeSize / 2,
              height: badgeSize,
              right: -badgeSize * 0.12,
              width: badgeSize,
            },
          ]}
        >
          <Plus
            color={color}
            height={badgeSize * 0.86}
            size={badgeSize * 0.86}
            strokeWidth={Math.max(4.8, strokeWidth * 2.4)}
            width={badgeSize * 0.86}
          />
        </View>
      </View>
    );
  }

  const Icon = iconComponents[name as keyof typeof iconComponents];

  return (
    <Icon
      color={color}
      height={size}
      size={size}
      strokeWidth={strokeWidth}
      width={size}
    />
  );
}

const styles = StyleSheet.create({
  composedIcon: {
    overflow: 'visible',
    position: 'relative',
  },
  composedBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    bottom: -2,
    justifyContent: 'center',
    position: 'absolute',
  },
});
