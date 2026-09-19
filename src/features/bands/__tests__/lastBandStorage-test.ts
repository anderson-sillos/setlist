import * as SecureStore from 'expo-secure-store';

import {
  clearLastBandId,
  readLastBandId,
  writeLastBandId,
} from '@/features/bands/lastBandStorage';

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const secureStoreMock = jest.mocked(SecureStore);

describe('lastBandStorage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await clearLastBandId();
  });

  it('persiste e recupera somente o identificador da banda', async () => {
    await writeLastBandId('band-demo-horizonte');

    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith(
      'setlist:last-selected-band',
      'band-demo-horizonte',
    );
    expect(await readLastBandId()).toBe('band-demo-horizonte');
  });

  it('limpa a seleção quando a participação deixa de existir', async () => {
    await writeLastBandId('band-demo-horizonte');
    await clearLastBandId();

    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalledWith(
      'setlist:last-selected-band',
    );
    expect(await readLastBandId()).toBeNull();
  });

  it('mantém a seleção em memória quando o armazenamento seguro falha', async () => {
    secureStoreMock.setItemAsync.mockRejectedValueOnce(new Error('offline'));
    await writeLastBandId('band-demo-horizonte');

    expect(await readLastBandId()).toBe('band-demo-horizonte');
  });
});
