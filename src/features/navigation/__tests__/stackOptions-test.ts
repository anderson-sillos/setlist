import { getStackScreenOptions } from '@/features/navigation/stackOptions';

describe('opções de transição da navegação', () => {
  it('usa fade breve na Web e transições nativas nas plataformas móveis', () => {
    expect(getStackScreenOptions('web', false)).toMatchObject({
      animation: 'fade',
      animationDuration: 140,
    });
    expect(getStackScreenOptions('ios', false).animation).toBe('default');
    expect(getStackScreenOptions('android', false).animation).toBe(
      'slide_from_right',
    );
  });

  it('remove animações não essenciais quando movimento reduzido está ativo', () => {
    expect(getStackScreenOptions('web', true)).toMatchObject({
      animation: 'none',
      animationDuration: 0,
    });
    expect(getStackScreenOptions('ios', true).animation).toBe('none');
  });
});
