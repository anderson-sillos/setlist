import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Ellipsis,
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
  back: ArrowLeft,
  band: Users,
  check: Check,
  chevronDown: ChevronDown,
  close: X,
  event: CalendarCheck,
  forward: ArrowRight,
  menu: Menu,
  more: Ellipsis,
  music: Music2,
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
      accessibilityElementsHidden
      accessible={false}
      color={color}
      height={size}
      importantForAccessibility="no"
      pointerEvents="none"
      size={size}
      strokeWidth={strokeWidth}
      width={size}
    />
  );
}
