import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import type { EntityId } from '@/domain';

export interface BandSectionScreenProps {
  readonly bandId: EntityId;
  readonly now?: Date;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}

export function rememberListScrollOffset(
  event: NativeSyntheticEvent<NativeScrollEvent>,
  rememberScrollOffset: (offset: number) => void,
) {
  rememberScrollOffset(event.nativeEvent.contentOffset.y);
}
