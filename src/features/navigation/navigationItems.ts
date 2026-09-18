import type { AppIconName } from '@/components/ui/AppIcon';
import type { BandSection } from '@/features/navigation/routes';

export interface NavigationItem {
  readonly icon: AppIconName;
  readonly label: string;
  readonly section: BandSection;
}

export const navigationItems: readonly NavigationItem[] = [
  { icon: 'shows', label: 'Shows', section: 'shows' },
  { icon: 'repertoire', label: 'Repertório', section: 'repertoire' },
  { icon: 'stage', label: 'Palco', section: 'stage' },
  { icon: 'band', label: 'Banda', section: 'band' },
];
