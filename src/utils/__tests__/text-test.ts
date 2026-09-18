import { normalizeForSearch } from '@/utils/text';

describe('texto compartilhado', () => {
  it('normaliza acentos, espaços e caixa para buscas', () => {
    expect(normalizeForSearch('  Praça Áurea  ')).toBe('praca aurea');
  });
});
