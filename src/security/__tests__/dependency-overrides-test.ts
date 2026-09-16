import decodeUriComponent from 'decode-uri-component';

describe('overrides de dependências vulneráveis', () => {
  it('decodifica componentes válidos e preserva entradas malformadas', () => {
    expect(decodeUriComponent('Setlist%20ao%20vivo')).toBe('Setlist ao vivo');
    expect(decodeUriComponent('%C3%A7')).toBe('ç');
    expect(decodeUriComponent('%E0%A4%A')).toBe('%E0%A4%A');
    expect(decodeUriComponent('100%')).toBe('100%');
  });

  it('processa uma sequência malformada extensa sem recursão', () => {
    const malformedInput = '%E0%A4%A'.repeat(1_000);

    expect(decodeUriComponent(malformedInput)).toBe(malformedInput);
  });
});
