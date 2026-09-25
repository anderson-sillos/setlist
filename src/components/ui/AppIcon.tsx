import { StyleSheet, View } from 'react-native';

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Archive,
  Ban,
  CalendarCheck,
  CalendarDays,
  CalendarMinus,
  CalendarPlus,
  Check,
  Copy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Ellipsis,
  ExternalLink,
  Hourglass,
  HourglassCog,
  LayoutGrid,
  Layers,
  Maximize2,
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
  RefreshCw,
  Search,
  Share2,
  Trash2,
  UserGroup,
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
  archive: Archive,
  moveDown: ArrowDown,
  moveUp: ArrowUp,
  back: ChevronLeft,
  band: Users,
  bands: LayoutGrid,
  block: Layers,
  check: Check,
  chevronDown: ChevronDown,
  close: X,
  copy: Copy,
  duration: Hourglass,
  dragHandle: Menu,
  edit: Pencil,
  event: CalendarCheck,
  externalLink: ExternalLink,
  expand: Maximize2,
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
  calendarMinus: CalendarMinus,
  stage: Play,
  sort: ArrowUpDown,
  remove: Trash2,
  renew: RefreshCw,
  revoke: Ban,
  share: Share2,
} satisfies Record<string, LucideIcon>;

const composedIconComponents = {
  bandAdd: UserGroup,
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
      <View style={[styles.composedIcon, { height: size, width: size }]}>
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

  if (name === 'dragHandle') {
    return (
      <View style={styles.dragHandleIcon}>
        <Icon
          color={color}
          height={size}
          size={size}
          strokeWidth={strokeWidth}
          width={size}
        />
      </View>
    );
  }

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
    pointerEvents: 'none',
    position: 'relative',
  },
  composedBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    bottom: -2,
    justifyContent: 'center',
    position: 'absolute',
  },
  dragHandleIcon: {
    pointerEvents: 'none',
    transform: [{ scaleY: 0.72 }],
  },
});
