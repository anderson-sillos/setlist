import { getSupabaseClient } from '@/data/supabase/client';
import type { EntityId } from '@/domain';

export type ContentReportKind = 'song' | 'user';

export async function sendContentReport({
  bandId,
  description,
  kind,
  targetId,
}: {
  readonly bandId: EntityId;
  readonly description: string;
  readonly kind: ContentReportKind;
  readonly targetId: EntityId;
}): Promise<void> {
  const normalizedDescription = description.trim();
  if (
    normalizedDescription.length < 10 ||
    normalizedDescription.length > 2000
  ) {
    throw new Error('Descreva o motivo da denúncia em 10 a 2.000 caracteres.');
  }

  const { data, error } = await getSupabaseClient().functions.invoke(
    'report-content',
    { body: { bandId, description: normalizedDescription, kind, targetId } },
  );

  if (error || data?.accepted !== true) {
    throw new Error(
      'Não foi possível confirmar o envio da denúncia. Tente novamente.',
    );
  }
}
