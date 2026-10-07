import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  CalendarCheck,
  CalendarDays,
  CalendarMinus,
  CalendarPlus,
  Check,
  CircleAlert,
  CircleDashed,
  ClipboardList,
  Clock,
  Copy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  CircleX,
  Ellipsis,
  ExternalLink,
  FileText,
  FileX2,
  Flag,
  GripVertical,
  Layers,
  LayoutGrid,
  ListFilter,
  ListMusic,
  ListPlus,
  LogIn,
  LogOut,
  Maximize2,
  MicVocal,
  Menu,
  Minus,
  Music2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Share2,
  Timer,
  Trash2,
  Undo2,
  UserMinus,
  UserPlus,
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
  bandAdd: UserPlus,
  block: Layers,
  check: Check,
  alert: CircleAlert,
  chevronDown: ChevronDown,
  close: X,
  copy: Copy,
  delete: Trash2,
  duration: Clock,
  dragHandle: GripVertical,
  edit: Pencil,
  event: CalendarDays,
  externalLink: ExternalLink,
  expand: Maximize2,
  fileText: FileText,
  fileMissing: FileX2,
  filter: ListFilter,
  flag: Flag,
  forward: ChevronRight,
  login: LogIn,
  logout: LogOut,
  menu: Menu,
  minus: Minus,
  more: Ellipsis,
  music: Music2,
  musicAdd: ListPlus,
  planning: ClipboardList,
  repertoire: ListMusic,
  search: Search,
  shows: CalendarDays,
  showAdd: CalendarPlus,
  showReady: CalendarCheck,
  showDraft: CircleDashed,
  showCancelled: CircleX,
  calendarMinus: CalendarMinus,
  stage: MicVocal,
  sort: ArrowUpDown,
  remove: Minus,
  removeMember: UserMinus,
  renew: RotateCcw,
  refresh: RefreshCw,
  reopen: Undo2,
  restore: RotateCcw,
  revoke: Ban,
  share: Share2,
  timer: Timer,
} satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof iconComponents;

interface AppIconProps {
  readonly color?: string;
  readonly name: AppIconName;
  readonly size?: number;
  readonly strokeWidth?: number;
}

export function AppIcon({
  color = colors.text.secondary,
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
