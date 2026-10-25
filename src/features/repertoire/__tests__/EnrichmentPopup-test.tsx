import * as ReactNative from 'react-native';
import type { ComponentRef } from 'react';
import { Pressable } from 'react-native';

import { restoreEnrichmentTriggerFocus } from '@/features/repertoire/EnrichmentPopup';

describe('restoreEnrichmentTriggerFocus', () => {
  it('focuses the trigger through its ref on web without findNodeHandle', () => {
    const previousPlatform = ReactNative.Platform.OS;
    const findNodeHandleSpy = jest.spyOn(ReactNative, 'findNodeHandle');
    const focus = jest.fn();
    const trigger = { focus } as unknown as ComponentRef<typeof Pressable>;

    Object.defineProperty(ReactNative.Platform, 'OS', {
      configurable: true,
      value: 'web',
    });

    try {
      restoreEnrichmentTriggerFocus(trigger);

      expect(focus).toHaveBeenCalledTimes(1);
      expect(findNodeHandleSpy).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(ReactNative.Platform, 'OS', {
        configurable: true,
        value: previousPlatform,
      });
      findNodeHandleSpy.mockRestore();
    }
  });
});
