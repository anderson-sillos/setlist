import { buildReportEmailText, parseReportInput } from './report';

const bandId = '00000000-0000-4000-8000-000000000001';
const targetId = '00000000-0000-4000-8000-000000000002';

describe('payloads de denúncia por e-mail', () => {
  it.each(['song', 'user'] as const)('aceita alvo do tipo %s', (kind) => {
    expect(
      parseReportInput({
        bandId,
        description: '  Descrição objetiva para análise  ',
        kind,
        targetId,
      }),
    ).toEqual({
      bandId,
      description: 'Descrição objetiva para análise',
      kind,
      targetId,
    });
  });

  it('envia somente identificadores e descrição, sem anexar letra ou metadados da música', () => {
    const privateLyrics = 'VERSO PRIVADO QUE NÃO DEVE IR NO EMAIL';
    const report = parseReportInput({
      bandId,
      description: 'A música contém informação que deve ser analisada.',
      kind: 'song',
      lyrics: privateLyrics,
      targetId,
      title: 'Título privado da música',
    });

    expect(report).not.toBeNull();
    expect(report).not.toHaveProperty('lyrics');
    expect(report).not.toHaveProperty('title');

    const emailText = buildReportEmailText(
      report!,
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000004',
    );
    expect(emailText).toContain(`Banda: ${bandId}`);
    expect(emailText).toContain(`Alvo: ${targetId}`);
    expect(emailText).toContain(
      'A música contém informação que deve ser analisada.',
    );
    expect(emailText).not.toContain(privateLyrics);
    expect(emailText).not.toContain('Título privado da música');
  });

  it('recusa tipos, identificadores e descrições fora dos limites', () => {
    expect(
      parseReportInput({
        bandId,
        description: 'long enough description',
        kind: 'band',
        targetId,
      }),
    ).toBeNull();
    expect(
      parseReportInput({
        bandId: 'não é uuid',
        description: 'long enough description',
        kind: 'user',
        targetId,
      }),
    ).toBeNull();
    expect(
      parseReportInput({
        bandId,
        description: 'curta',
        kind: 'song',
        targetId,
      }),
    ).toBeNull();
  });
});
