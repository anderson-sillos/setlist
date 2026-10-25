import { convertEnrichmentLyrics } from '../lyrics';
import { deriveLyricStatus } from '@/domain/lyricStatus';

function ids() {
  let nextId = 0;
  return () => `id-${++nextId}`;
}

describe('convertEnrichmentLyrics', () => {
  it('converte frações, offset e marcas múltiplas com IDs locais novos', () => {
    const result = convertEnrichmentLyrics(
      {
        plainLyrics: null,
        recordingDurationMs: 8_000,
        syncedLyrics:
          '[offset:+100]\n[00:01.0][00:02.20]Refrão\n[00:03.123]Final',
      },
      ids(),
    );

    expect(result.synchronized).toBe(true);
    expect(result.synchronizedDocument?.blocks).toEqual([
      {
        id: 'id-4',
        name: null,
        lines: [
          { id: 'id-1', text: 'Refrão', startTimeMs: 1_100 },
          { id: 'id-2', text: 'Refrão', startTimeMs: 2_300 },
          { id: 'id-3', text: 'Final', startTimeMs: 3_223 },
        ],
      },
    ]);
    expect(
      result.staticDocument?.blocks[0]?.lines.map(({ text }) => text),
    ).toEqual(['Refrão', 'Final']);
  });

  it('preserva separações de estrofe e ordena linhas por tempo', () => {
    const result = convertEnrichmentLyrics(
      {
        plainLyrics: null,
        recordingDurationMs: 10_000,
        syncedLyrics: '[00:04.00]Segunda\n\n[00:01.00]Primeira',
      },
      ids(),
    );

    expect(
      result.synchronizedDocument?.blocks.map((block) =>
        block.lines.map(({ text, startTimeMs }) => ({ text, startTimeMs })),
      ),
    ).toEqual([
      [{ text: 'Primeira', startTimeMs: 1_000 }],
      [{ text: 'Segunda', startTimeMs: 4_000 }],
    ]);
  });

  it('usa marcadores vazios com horário como quebras sem importar linhas ou blocos vazios', () => {
    const result = convertEnrichmentLyrics(
      {
        plainLyrics: null,
        recordingDurationMs: 20_000,
        syncedLyrics:
          '[00:00.00]\n[00:01.00]Primeira\n[00:03.00]\n[00:05.00]Segunda\n[00:07.00]\n[00:07.00]\n[00:09.00]Terceira\n[00:12.00]',
      },
      ids(),
    );

    expect(
      result.synchronizedDocument?.blocks.map(({ name, lines }) => ({
        name,
        lines: lines.map(({ text, startTimeMs }) => ({ text, startTimeMs })),
      })),
    ).toEqual([
      { name: null, lines: [{ text: 'Primeira', startTimeMs: 1_000 }] },
      { name: null, lines: [{ text: 'Segunda', startTimeMs: 5_000 }] },
      { name: null, lines: [{ text: 'Terceira', startTimeMs: 9_000 }] },
    ]);
    expect(deriveLyricStatus(result.synchronizedDocument!)).toBe(
      'synchronized',
    );
  });

  it('aproveita parágrafos do texto correspondente antes da inferência por pausas', () => {
    const result = convertEnrichmentLyrics(
      {
        plainLyrics:
          ' primeira   linha\nSEGUNDA LINHA\nTerceira linha\n\nQuarta linha\nQuinta linha',
        recordingDurationMs: 40_000,
        syncedLyrics:
          '[00:01.00]Primeira linha\n[00:05.00]Segunda linha\n[00:25.00]Terceira linha\n[00:29.00]Quarta linha\n[00:33.00]Quinta linha',
      },
      ids(),
    );

    expect(
      result.synchronizedDocument?.blocks.map(({ lines }) =>
        lines.map(({ text, startTimeMs }) => ({ text, startTimeMs })),
      ),
    ).toEqual([
      [
        { text: 'Primeira linha', startTimeMs: 1_000 },
        { text: 'Segunda linha', startTimeMs: 5_000 },
        { text: 'Terceira linha', startTimeMs: 25_000 },
      ],
      [
        { text: 'Quarta linha', startTimeMs: 29_000 },
        { text: 'Quinta linha', startTimeMs: 33_000 },
      ],
    ]);
  });

  it.each([
    'Primeira\nSegunda\n\nTexto diferente\nQuarta',
    'Primeira\n\nSegunda',
  ])(
    'ignora parágrafos quando o texto simples não corresponde ao LRC (%s)',
    (plainLyrics) => {
      const result = convertEnrichmentLyrics({
        plainLyrics,
        recordingDurationMs: 20_000,
        syncedLyrics:
          '[00:01.00]Primeira\n[00:05.00]Segunda\n[00:09.00]Terceira\n[00:13.00]Quarta',
      });

      expect(result.synchronizedDocument?.blocks).toHaveLength(1);
      expect(
        result.synchronizedDocument?.blocks[0]?.lines.map(({ text }) => text),
      ).toEqual(['Primeira', 'Segunda', 'Terceira', 'Quarta']);
    },
  );

  it.each([
    ['pausa proporcional no limite', [1, 5, 9, 19, 23], [3, 2]],
    ['pausa abaixo da proporção', [1, 5, 9, 18, 22], [5]],
    ['pausa de oito segundos', [1, 3, 5, 13, 15], [3, 2]],
    ['pausa menor que oito segundos', [1, 3, 5, 12.999, 14.999], [5]],
    ['intervalos lentos regulares', [1, 10, 19, 28, 37], [5]],
    ['três intervalos positivos', [1, 5, 15, 19], [2, 2]],
    ['poucos intervalos', [1, 5, 25], [3]],
    ['tempos coincidentes sem amostra suficiente', [1, 1, 1, 25], [4]],
  ] as const)(
    'organiza quebras por tempo sem alterar a letra: %s',
    (_name, times, blockSizes) => {
      const result = convertEnrichmentLyrics({
        plainLyrics: null,
        recordingDurationMs: 60_000,
        syncedLyrics: times
          .map(
            (seconds, index) =>
              `[00:${seconds.toFixed(3).padStart(6, '0')}]Linha ${index + 1}`,
          )
          .join('\n'),
      });

      expect(
        result.synchronizedDocument?.blocks.map(({ lines }) => lines.length),
      ).toEqual(blockSizes);
      expect(
        result.synchronizedDocument?.blocks.every(({ name }) => name === null),
      ).toBe(true);
      expect(
        result.synchronizedDocument?.blocks.flatMap(({ lines }) =>
          lines.map(({ text, startTimeMs }) => ({ text, startTimeMs })),
        ),
      ).toEqual(
        times.map((seconds, index) => ({
          text: `Linha ${index + 1}`,
          startTimeMs: Math.round(seconds * 1000),
        })),
      );
      expect(deriveLyricStatus(result.synchronizedDocument!)).toBe(
        'synchronized',
      );
    },
  );

  it('infere pausas depois de expandir e ordenar marcas repetidas', () => {
    const result = convertEnrichmentLyrics({
      plainLyrics: null,
      recordingDurationMs: 40_000,
      syncedLyrics:
        '[00:01.00][00:25.00]Primeira\n[00:05.00][00:29.00]Segunda\n[00:09.00][00:33.00]Terceira',
    });

    expect(
      result.synchronizedDocument?.blocks.map(({ lines }) =>
        lines.map(({ text, startTimeMs }) => ({ text, startTimeMs })),
      ),
    ).toEqual([
      [
        { text: 'Primeira', startTimeMs: 1_000 },
        { text: 'Segunda', startTimeMs: 5_000 },
        { text: 'Terceira', startTimeMs: 9_000 },
      ],
      [
        { text: 'Primeira', startTimeMs: 25_000 },
        { text: 'Segunda', startTimeMs: 29_000 },
        { text: 'Terceira', startTimeMs: 33_000 },
      ],
    ]);
  });

  it('usa texto simples e não expõe marcações técnicas quando LRC não é aproveitável', () => {
    const result = convertEnrichmentLyrics(
      {
        plainLyrics: null,
        recordingDurationMs: 5_000,
        syncedLyrics:
          '[ti:Canção]\n[00:01.00]Primeira linha\n[03:30.00]Última linha',
      },
      ids(),
    );

    expect(result.synchronized).toBe(false);
    expect(result.staticDocument?.blocks.flatMap(({ lines }) => lines)).toEqual(
      [
        { id: 'id-1', text: 'Primeira linha', startTimeMs: null },
        { id: 'id-2', text: 'Última linha', startTimeMs: null },
      ],
    );
    expect(JSON.stringify(result.staticDocument)).not.toMatch(/\[\d{2}:\d{2}/);
    expect(JSON.stringify(result.staticDocument)).not.toContain('[ti:');
    expect(deriveLyricStatus(result.staticDocument!)).toBe('static');
  });

  it('prefere texto simples para fallback estático e divide parágrafos', () => {
    const result = convertEnrichmentLyrics(
      {
        plainLyrics: 'Verso um\nVerso dois\n\nRefrão',
        recordingDurationMs: 100_000,
        syncedLyrics: '[00:01.00]Verso diferente\nlinha sem tempo',
      },
      ids(),
    );

    expect(
      result.staticDocument?.blocks.map(({ lines }) =>
        lines.map(({ text, startTimeMs }) => ({ text, startTimeMs })),
      ),
    ).toEqual([
      [
        { text: 'Verso um', startTimeMs: null },
        { text: 'Verso dois', startTimeMs: null },
      ],
      [{ text: 'Refrão', startTimeMs: null }],
    ]);
  });

  it('não fabrica letras para registros sem conteúdo', () => {
    const result = convertEnrichmentLyrics({
      plainLyrics: null,
      recordingDurationMs: null,
      syncedLyrics: '[ar:Instrumental]\n[offset:0]',
    });

    expect(result).toEqual({
      synchronizedDocument: null,
      staticDocument: null,
      hasText: false,
      synchronized: false,
    });
  });

  it('aceita a tolerância final de 2 s e recusa tempos posteriores a ela', () => {
    const atBoundary = convertEnrichmentLyrics({
      plainLyrics: null,
      recordingDurationMs: 5_000,
      syncedLyrics: '[00:07.00]Última linha',
    });
    const pastBoundary = convertEnrichmentLyrics({
      plainLyrics: null,
      recordingDurationMs: 5_000,
      syncedLyrics: '[00:07.01]Última linha',
    });

    expect(atBoundary.synchronized).toBe(true);
    expect(deriveLyricStatus(atBoundary.synchronizedDocument!)).toBe(
      'synchronized',
    );
    expect(pastBoundary.synchronized).toBe(false);
    expect(pastBoundary.staticDocument?.blocks[0]?.lines[0]?.startTimeMs).toBe(
      null,
    );
  });

  it('não sincroniza quando há linha sem tempo nem cria conteúdo sem texto', () => {
    const partiallyTimed = convertEnrichmentLyrics(
      {
        plainLyrics: null,
        recordingDurationMs: 60_000,
        syncedLyrics: '[00:01.00]Com tempo\nSem tempo',
      },
      ids(),
    );
    const noText = convertEnrichmentLyrics(
      {
        plainLyrics: null,
        recordingDurationMs: 60_000,
        syncedLyrics: '[00:01.00]\n[ti:Canção]',
      },
      ids(),
    );

    expect(partiallyTimed.synchronized).toBe(false);
    expect(partiallyTimed.staticDocument?.blocks[0]?.lines).toEqual([
      { id: expect.any(String), text: 'Com tempo', startTimeMs: null },
      { id: expect.any(String), text: 'Sem tempo', startTimeMs: null },
    ]);
    expect(noText).toMatchObject({ hasText: false, synchronized: false });
  });
});
