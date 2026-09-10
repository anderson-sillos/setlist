import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useBandMembers, useShows, useSongs } from '@/data/queries';
import type { EntityId, Show, ShowStatus, Song } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  getBandSectionHref,
  getShowHref,
  getSongHref,
} from '@/features/navigation/routes';
import { colors, radii, spacing } from '@/theme/tokens';

interface BandSectionScreenProps {
  readonly bandId: EntityId;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}

const showStatusLabels: Record<ShowStatus, string> = {
  draft: 'Rascunho',
  ready: 'Pronto',
  cancelled: 'Cancelado',
};

const lyricStatusLabels: Record<Song['lyricStatus'], string> = {
  missing: 'Sem letra',
  static: 'Letra estática',
  incomplete: 'Sincronização incompleta',
  synchronized: 'Sincronizada',
};

function formatShowDate(startsAt: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(startsAt));
}

function SectionIntro({ children }: { children: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText tone="accent" variant="eyebrow">
        Demonstração
      </AppText>
      <AppText tone="muted">{children}</AppText>
    </View>
  );
}

function LoadingState({ isPending }: { isPending: boolean }) {
  return isPending ? (
    <AppText accessibilityLiveRegion="polite">Carregando conteúdo…</AppText>
  ) : null;
}

function ErrorState({ isError }: { isError: boolean }) {
  return isError ? (
    <AppText accessibilityRole="alert">
      Não foi possível carregar esta área.
    </AppText>
  ) : null;
}

function ShowCard({ bandId, show }: { bandId: EntityId; show: Show }) {
  const itemCount = show.blocks.reduce(
    (total, block) => total + block.items.length,
    0,
  );

  return (
    <Link href={getShowHref(bandId, show.id)} asChild>
      <Pressable
        accessibilityLabel={`Abrir show ${show.name}`}
        accessibilityRole="link"
        style={({ pressed }) => [styles.itemCard, pressed && styles.pressed]}
      >
        <View style={styles.cardHeader}>
          <AppText style={styles.cardTitle} variant="heading">
            {show.name}
          </AppText>
          <View
            style={[styles.pill, show.status === 'ready' && styles.readyPill]}
          >
            <AppText variant="caption">{showStatusLabels[show.status]}</AppText>
          </View>
        </View>
        <AppText tone="muted">{formatShowDate(show.startsAt)}</AppText>
        <AppText>{show.venue}</AppText>
        <AppText tone="accent" variant="caption">
          {show.blocks.length} blocos · {itemCount} músicas
        </AppText>
      </Pressable>
    </Link>
  );
}

function SongCard({ bandId, song }: { bandId: EntityId; song: Song }) {
  return (
    <Link href={getSongHref(bandId, song.id)} asChild>
      <Pressable
        accessibilityLabel={`Abrir música ${song.title}`}
        accessibilityRole="link"
        style={({ pressed }) => [styles.itemCard, pressed && styles.pressed]}
      >
        <AppText tone="accent" variant="eyebrow">
          {lyricStatusLabels[song.lyricStatus]}
        </AppText>
        <AppText variant="heading">{song.title}</AppText>
        <AppText tone="muted">
          {song.originalArtist ?? 'Artista não informado'}
        </AppText>
        <AppText variant="caption">
          Tom {song.musicalKey ?? '—'} · BPM {song.bpm ?? '—'}
        </AppText>
      </Pressable>
    </Link>
  );
}

export function ShowsScreen({
  bandId,
  viewportHeight,
  viewportWidth,
}: BandSectionScreenProps) {
  const showsQuery = useShows(bandId);

  return (
    <BandAreaLayout
      activeSection="shows"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'shows') as string}
      title="Shows"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      <SectionIntro>
        Consulte eventos, estados e a organização de cada setlist.
      </SectionIntro>
      <LoadingState isPending={showsQuery.isPending} />
      <ErrorState isError={showsQuery.isError} />
      <ResponsiveGrid
        items={showsQuery.data ?? []}
        keyExtractor={({ id }) => id}
        renderItem={(show) => <ShowCard bandId={bandId} show={show} />}
        viewportWidth={viewportWidth}
      />
    </BandAreaLayout>
  );
}

export function RepertoireScreen({
  bandId,
  viewportHeight,
  viewportWidth,
}: BandSectionScreenProps) {
  const songsQuery = useSongs(bandId);

  return (
    <BandAreaLayout
      activeSection="repertoire"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'repertoire') as string}
      title="Repertório"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      <SectionIntro>
        Consulte metadados, preparação e letra vigente de cada música.
      </SectionIntro>
      <LoadingState isPending={songsQuery.isPending} />
      <ErrorState isError={songsQuery.isError} />
      <ResponsiveGrid
        items={songsQuery.data ?? []}
        keyExtractor={({ id }) => id}
        renderItem={(song) => <SongCard bandId={bandId} song={song} />}
        viewportWidth={viewportWidth}
      />
    </BandAreaLayout>
  );
}

export function BandScreen({
  bandId,
  viewportHeight,
  viewportWidth,
}: BandSectionScreenProps) {
  const membersQuery = useBandMembers(bandId);

  return (
    <BandAreaLayout
      activeSection="band"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'band') as string}
      title="Banda"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      <SectionIntro>
        {`${membersQuery.data?.length ?? 0} integrantes nesta banda.`}
      </SectionIntro>
      <LoadingState isPending={membersQuery.isPending} />
      <ErrorState isError={membersQuery.isError} />
      <Card style={styles.memberCard}>
        {membersQuery.data?.map((member) => (
          <View key={member.id} style={styles.memberRow}>
            <AppText>{member.displayName}</AppText>
            <AppText tone="muted" variant="caption">
              {member.role}
            </AppText>
          </View>
        ))}
      </Card>
    </BandAreaLayout>
  );
}

export { formatShowDate, lyricStatusLabels, showStatusLabels };

const styles = StyleSheet.create({
  sectionHeader: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    height: '100%',
    padding: spacing.xl,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
  },
  pill: {
    backgroundColor: colors.violetSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  readyPill: {
    backgroundColor: colors.cyanSoft,
  },
  memberCard: {
    gap: spacing.md,
  },
  memberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.72,
  },
});
