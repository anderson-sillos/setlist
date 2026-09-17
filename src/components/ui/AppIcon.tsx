import {
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Hourglass,
  HourglassCog,
  LayoutGrid,
  Menu,
  Music,
  Music2,
  Play,
  Search,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react-native';

import { colors } from '@/theme/tokens';

const iconComponents = {
  back: ChevronLeft,
  band: Users,
  bands: LayoutGrid,
  check: Check,
  chevronDown: ChevronDown,
  close: X,
  duration: Hourglass,
  event: CalendarCheck,
  forward: ChevronRight,
  menu: Menu,
  more: Ellipsis,
  music: Music2,
  planning: HourglassCog,
  repertoire: Music,
  search: Search,
  shows: CalendarDays,
  stage: Play,
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
