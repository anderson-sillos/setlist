import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  stage: Play,
  sort: ArrowUpDown,
  remove: Trash2,
} satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof iconComponents;

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
  const Icon = iconComponents[name];

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
