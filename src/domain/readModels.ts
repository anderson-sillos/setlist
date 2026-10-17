import type {
  BandRole,
  EntityId,
  IsoDateTime,
  LyricStatus,
  ShowStatus,
} from '@/domain/entities';

/** Dados da banda necessários ao cabeçalho e às ações da área atual. */
export interface BandContext {
  readonly bandId: EntityId;
  readonly bandName: string;
  readonly role: BandRole;
  readonly hasActiveSongs: boolean;
}

/** Dados mínimos de cada banda na tela Minhas bandas. */
export interface UserBandSummary {
  readonly bandId: EntityId;
  readonly bandName: string;
  readonly role: BandRole;
  readonly nextShowStartsAt: IsoDateTime | null;
}

/** Metadados usados em listas, filtros e seletores; não contém a letra. */
export interface SongSummary {
  readonly id: EntityId;
  readonly bandId: EntityId;
  readonly title: string;
  readonly originalArtist: string | null;
  readonly musicalKey: string | null;
  readonly bpm: number | null;
  readonly estimatedDurationMs: number | null;
  readonly lyricStatus: LyricStatus;
  readonly archivedAt: IsoDateTime | null;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}

/** Campos de lista de um show; os blocos e itens pertencem ao documento Show. */
export interface ShowSummary {
  readonly id: EntityId;
  readonly bandId: EntityId;
  readonly name: string;
  readonly startsAt: IsoDateTime;
  readonly venue: string;
  readonly status: ShowStatus;
  readonly estimatedDurationMs: number | null;
}
