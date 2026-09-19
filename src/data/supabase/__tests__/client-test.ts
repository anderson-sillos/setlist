import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import {
  createConfiguredSupabaseClient,
  getSupabaseClient,
} from '@/data/supabase/client';
import type { PublicEnvironment } from '@/config/environment';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ mocked: true })),
}));

const createClientMock = jest.mocked(createClient);

const developmentEnvironment: PublicEnvironment = {
  appEnvironment: 'development',
  supabase: {
    publishableKey: 'sb_publishable_development_key',
    url: 'https://development-project.supabase.co',
  },
};

describe('cliente Supabase', () => {
  beforeEach(() => {
    createClientMock.mockClear();
    process.env.EXPO_PUBLIC_APP_ENV = 'development';
    process.env.EXPO_PUBLIC_SUPABASE_URL = developmentEnvironment.supabase.url;
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      developmentEnvironment.supabase.publishableKey;
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_APP_ENV;
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it('usa somente a URL e a chave publicável do ambiente', () => {
    const client = createConfiguredSupabaseClient(developmentEnvironment);

    expect(client).toEqual({ mocked: true });
    expect(createClientMock).toHaveBeenCalledWith(
      'https://development-project.supabase.co',
      'sb_publishable_development_key',
      expect.objectContaining({
        auth: expect.objectContaining({
          detectSessionInUrl: false,
          experimental: {
            appendPkceFlowIdToRedirects: true,
          },
          flowType: 'pkce',
          persistSession: true,
        }),
      }),
    );

    const options = createClientMock.mock.calls[0][2];
    if (Platform.OS === 'web') {
      expect(options?.auth?.storage).toBeUndefined();
    } else {
      expect(options?.auth?.storage).toEqual(expect.any(Object));
    }
    expect(createClientMock.mock.calls[0]).toHaveLength(3);
  });

  it('reutiliza a instância configurada para o processo', () => {
    const first = getSupabaseClient();
    const second = getSupabaseClient();

    expect(first).toBe(second);
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });
});
