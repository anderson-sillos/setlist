const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ReportInput = {
  bandId: string;
  description: string;
  kind: 'song' | 'user';
  targetId: string;
};

export function parseReportInput(value: unknown): ReportInput | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (
    (input.kind !== 'song' && input.kind !== 'user') ||
    typeof input.bandId !== 'string' ||
    !uuidPattern.test(input.bandId) ||
    typeof input.targetId !== 'string' ||
    !uuidPattern.test(input.targetId) ||
    typeof input.description !== 'string'
  ) {
    return null;
  }
  const description = input.description.trim();
  if (description.length < 10 || description.length > 2000) return null;
  return {
    bandId: input.bandId,
    description,
    kind: input.kind,
    targetId: input.targetId,
  };
}

export function buildReportEmailText(
  report: ReportInput,
  ticket: string,
  reporterId: string,
): string {
  return [
    `Caso: ${ticket}`,
    `Tipo: ${report.kind === 'song' ? 'música' : 'usuário'}`,
    `Banda: ${report.bandId}`,
    `Alvo: ${report.targetId}`,
    `Denunciante: ${reporterId}`,
    '',
    'Descrição informada:',
    report.description,
  ].join('\n');
}
