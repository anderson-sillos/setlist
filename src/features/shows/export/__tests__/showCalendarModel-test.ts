import { createShow } from '@/testing/factories';

import {
  createCalendarDraft,
  createShowCalendarIcs,
  parseZonedDateTime,
  validateCalendarDraft,
} from '../showCalendarModel';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn().mockResolvedValue('a'.repeat(64)),
}));

describe('cópia do show para calendário', () => {
  it('interpreta o término no fuso de referência e permite cruzar a meia-noite', () => {
    const show = createShow({
      id: 'private-show-id',
      startsAt: '2026-10-22T23:30:00-03:00',
    });
    const draft = createCalendarDraft(show, 'Banda exemplo', null);
    const validation = validateCalendarDraft(
      draft,
      '2026-10-23',
      '00:30',
      false,
    );

    expect(draft.endDate).toBe('');
    expect(validation.valid).toBe(true);
    if (validation.valid) {
      expect(validation.event.startDate.toISOString()).toBe(
        '2026-10-23T02:30:00.000Z',
      );
      expect(validation.event.endDate.toISOString()).toBe(
        '2026-10-23T03:30:00.000Z',
      );
    }
  });

  it('sugere término apenas para duração positiva e bloqueia término inválido', () => {
    const show = createShow({ startsAt: '2026-10-22T22:00:00-03:00' });
    const suggested = createCalendarDraft(show, 'Banda exemplo', 90 * 60_000);
    const invalid = validateCalendarDraft(
      suggested,
      '2026-10-22',
      '21:00',
      false,
    );

    expect(suggested.suggestedEnd).toBe(true);
    expect(suggested.endDate).toBe('2026-10-22');
    expect(invalid.valid).toBe(false);
    expect(parseZonedDateTime('2026-02-31', '12:00')).toBeNull();
    expect(parseZonedDateTime('2026-10-22', '24:00')).toBeNull();
    expect(
      parseZonedDateTime('2026-01-10', '12:00', 'Asia/Tokyo')?.toISOString(),
    ).toBe('2026-01-10T03:00:00.000Z');
    expect(
      parseZonedDateTime('2026-03-08', '02:30', 'America/New_York'),
    ).toBeNull();
    expect(createCalendarDraft(show, 'Banda exemplo', 0).endDate).toBe('');
    expect(createCalendarDraft(show, 'Banda exemplo', null).endTime).toBe('');
  });

  it('faz uma cópia mínima e só inclui observações quando selecionadas', () => {
    const show = createShow({
      id: 'private-show-id',
      name: 'Show seguro',
      status: 'draft',
      notes: 'Nota selecionável',
      startsAt: '2026-10-22T22:00:00-03:00',
    });
    const draft = createCalendarDraft(show, 'Banda exemplo', null);
    const withoutNotes = validateCalendarDraft(
      draft,
      '2026-10-22',
      '23:00',
      false,
    );
    const withNotes = validateCalendarDraft(draft, '2026-10-22', '23:00', true);

    expect(draft.statusLabel).toBe('Rascunho');
    expect(withoutNotes.valid).toBe(true);
    expect(withNotes.valid).toBe(true);
    if (!withoutNotes.valid || !withNotes.valid) return;
    expect(withoutNotes.event.description).not.toContain('Nota selecionável');
    expect(withNotes.event.description).toContain('Nota selecionável');
    expect(Object.keys(withoutNotes.event).sort()).toEqual([
      'description',
      'endDate',
      'location',
      'startDate',
      'timeZone',
      'title',
    ]);
    const publicCopy = JSON.stringify(withoutNotes.event);
    expect(publicCopy).not.toContain('private-show-id');
    expect(publicCopy).not.toMatch(/lyrics?|integrante|música/i);
  });

  it('identifica shows Rascunho, Pronto, Cancelado e passados sem acrescentar a setlist', () => {
    const cases = [
      { status: 'draft' as const, label: 'Rascunho' },
      { status: 'ready' as const, label: 'Pronto' },
      { status: 'cancelled' as const, label: 'Cancelado' },
    ];

    cases.forEach(({ status, label }) => {
      const draft = createCalendarDraft(
        createShow({ status, startsAt: '2020-01-01T20:00:00-03:00' }),
        'Banda exemplo',
        null,
      );
      const result = validateCalendarDraft(draft, '2020-01-01', '22:00', false);

      expect(draft.statusLabel).toBe(label);
      expect(draft.startLabel).toMatch(/2020/);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(Object.keys(result.event).sort()).toEqual([
          'description',
          'endDate',
          'location',
          'startDate',
          'timeZone',
          'title',
        ]);
        expect(result.event.description).toContain(
          `Estado no Setlist: ${label}`,
        );
        expect(result.event.description).not.toMatch(
          /música indisponível|letra|integrante|convidado|credential/i,
        );
      }
    });
  });

  it('gera um único evento ICS com escapes, identidade estável e linhas UTF-8 dobradas', async () => {
    const show = createShow({
      id: 'private-show-id',
      name: `${'é'.repeat(80)},;\nBEGIN:VEVENT`,
      startsAt: '2026-10-22T22:00:00-03:00',
      venue: 'Rua A, 10; sala 2',
      notes: 'Observação\\com vírgula, ponto; e\nquebra',
    });
    const draft = createCalendarDraft(show, 'Banda exemplo', 60 * 60_000);
    const validation = validateCalendarDraft(
      draft,
      draft.endDate,
      draft.endTime,
      true,
    );
    expect(validation.valid).toBe(true);
    if (!validation.valid) return;

    const file = await createShowCalendarIcs(
      draft,
      validation.event,
      new Date('2026-10-20T12:00:00.000Z'),
    );
    const lines = file.split('\r\n').filter(Boolean);

    expect(lines.filter((line) => line === 'BEGIN:VEVENT')).toHaveLength(1);
    expect(lines).toContain('VERSION:2.0');
    expect(lines).toContain('CALSCALE:GREGORIAN');
    expect(
      lines.some((line) => line.startsWith('DTSTART:20261023T010000Z')),
    ).toBe(true);
    expect(lines.some((line) => line.startsWith('SUMMARY:'))).toBe(true);
    expect(
      lines.some((line) => line.startsWith('LOCATION:Rua A\\, 10\\; sala 2')),
    ).toBe(true);
    const unfoldedFile = file.replace(/\r\n[ \t]/g, '');
    expect(unfoldedFile).toContain(`UID:${'a'.repeat(64)}@setlistbr.app.br`);
    expect(file).not.toContain('private-show-id');
    expect(
      lines.every((line) => new TextEncoder().encode(line).length <= 75),
    ).toBe(true);
    expect(file).toContain('\\nBEGIN:VEVENT');
  });
});
