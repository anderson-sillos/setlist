import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ListEmptyState } from '@/components/ui/ListEmptyState';
import {
  ChoiceChips,
  ListControls,
  OptionMenu,
  SearchField,
} from '@/components/ui/ListControls';
import {
  useBandMembers,
  useShows,
  useSongs,
  useUserBands,
} from '@/data/queries';
import type {
  BandMember,
  BandRole,
  EntityId,
  Show,
  ShowStatus,
  Song,
} from '@/domain';
import { MonthCalendar } from '@/features/calendar/MonthCalendar';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import {
  formatDuration,
  formatShowDate,
  getShowDurationMs,
  lyricStatusLabels,
  normalizeForSearch,
  showStatusLabels,
} from '@/features/navigation/display';
import {
  getBandSectionHref,
  getShowHref,
  getSongHref,
} from '@/features/navigation/routes';
import { useSectionViewState } from '@/features/navigation/useSectionViewState';
import { colors, layout, radii, spacing } from '@/theme/tokens';

interface BandSectionScreenProps {
  readonly bandId: EntityId;
  readonly now?: Date;
  readonly viewportHeight?: number;
  readonly viewportWidth?: number;
}

type RepertoireFilter = 'all' | 'archived' | 'pending' | 'synchronized';
type RepertoireSort = 'artist' | 'duration' | 'title' | 'updated';
type ShowPeriod = 'all' | 'past' | 'upcoming';
type ShowStatusFilter = 'active' | 'all' | ShowStatus;
type ShowSort = 'date-asc' | 'date-desc' | 'duration' | 'name';
type ShowView = 'calendar' | 'list';

const repertoireFilters = [
  { label: 'Todas', value: 'all' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Sincronizadas', value: 'synchronized' },
  { label: 'Arquivadas', value: 'archived' },
] as const;

const repertoireSorts = [
  { label: 'Título', value: 'title' },
  { label: 'Artista/Banda', value: 'artist' },
  { label: 'Atualizadas recentemente', value: 'updated' },
  { label: 'Maior duração', value: 'duration' },
] as const;

const showViews = [
  { label: 'Lista', value: 'list' },
  { label: 'Calendário', value: 'calendar' },
] as const;

const showPeriods = [
  { label: 'Próximos', value: 'upcoming' },
  { label: 'Passados', value: 'past' },
  { label: 'Todos', value: 'all' },
] as const;

const showStatuses = [
  { label: 'Ativos', value: 'active' },
  { label: 'Rascunho', value: 'draft' },
  { label: 'Pronto', value: 'ready' },
  { label: 'Cancelado', value: 'cancelled' },
  { label: 'Todos', value: 'all' },
] as const;

const showSorts = [
  { label: 'Data mais próxima', value: 'date-asc' },
  { label: 'Data mais distante', value: 'date-desc' },
  { label: 'Nome', value: 'name' },
  { label: 'Maior duração', value: 'duration' },
] as const;

const roleLabels: Record<BandRole, string> = {
  editor: 'Editor',
  member: 'Integrante',
  owner: 'Proprietário',
};

const roleGroupLabels: Record<BandRole, string> = {
  editor: 'Editores',
  member: 'Integrantes',
  owner: 'Proprietários',
};

function LoadingState({ isPending }: { readonly isPending: boolean }) {
  return isPending ? (
    <AppText
      accessibilityLiveRegion="polite"
      style={styles.feedback}
      tone="muted"
    >
      Preparando o palco…
    </AppText>
  ) : null;
}

function ErrorState({ isError }: { readonly isError: boolean }) {
  return isError ? (
    <AppText accessibilityRole="alert" style={styles.feedback}>
      Essa lista saiu do tom. Não foi possível carregar o conteúdo.
    </AppText>
  ) : null;
}

function StatusPill({
  children,
  tone = 'default',
}: {
  readonly children: string;
  readonly tone?: 'default' | 'ready' | 'warning';
}) {
  return (
    <View
      style={[
        styles.pill,
        tone === 'ready' && styles.readyPill,
        tone === 'warning' && styles.warningPill,
      ]}
    >
      <AppText variant="caption">{children}</AppText>
    </View>
  );
}

function SongRow({ bandId, song }: { bandId: EntityId; song: Song }) {
  return (
    <View style={styles.rowFrame}>
      <Link href={getSongHref(bandId, song.id)} asChild>
        <Pressable
          accessibilityLabel={`Abrir música ${song.title}`}
          accessibilityRole="link"
          style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}
        >
          <View style={styles.rowCopy}>
            <View style={styles.rowTitleLine}>
              <AppText style={styles.rowTitle} variant="heading">
                {song.title}
              </AppText>
              <StatusPill
                tone={
                  song.lyricStatus === 'synchronized'
                    ? 'ready'
                    : song.lyricStatus === 'missing'
                      ? 'warning'
                      : 'default'
                }
              >
                {lyricStatusLabels[song.lyricStatus]}
              </StatusPill>
            </View>
            <AppText tone="muted">
              {song.originalArtist ?? 'Artista/Banda não informado'}
            </AppText>
          </View>
          <View style={styles.rowMeta}>
            <AppText variant="caption">Duração</AppText>
            <AppText tone="accent">
              {song.estimatedDurationMs === null
                ? '—'
                : formatDuration(song.estimatedDurationMs)}
            </AppText>
          </View>
          <AppText tone="accent">›</AppText>
        </Pressable>
      </Link>
    </View>
  );
}

function ShowRow({
  bandId,
  durationMs,
  show,
}: {
  readonly bandId: EntityId;
  readonly durationMs: number | null;
  readonly show: Show;
}) {
  return (
    <View style={styles.rowFrame}>
      <Link href={getShowHref(bandId, show.id)} asChild>
        <Pressable
          accessibilityLabel={`Abrir show ${show.name}`}
          accessibilityRole="link"
          style={({ pressed }) => [
            styles.listRow,
            show.status === 'cancelled' && styles.cancelledRow,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.rowCopy}>
            <View style={styles.rowTitleLine}>
              <AppText style={styles.rowTitle} variant="heading">
                {show.name}
              </AppText>
              <StatusPill tone={show.status === 'ready' ? 'ready' : 'default'}>
                {showStatusLabels[show.status]}
              </StatusPill>
            </View>
            <AppText tone="muted">{formatShowDate(show.startsAt)}</AppText>
            <AppText variant="caption">{show.venue}</AppText>
          </View>
          <View style={styles.rowMeta}>
            <AppText variant="caption">Tempo total</AppText>
            <AppText tone="accent">
              {durationMs === null ? '—' : formatDuration(durationMs)}
            </AppText>
          </View>
          <AppText tone="accent">›</AppText>
        </Pressable>
      </Link>
    </View>
  );
}

function onListScroll(
  event: NativeSyntheticEvent<NativeScrollEvent>,
  rememberScrollOffset: (offset: number) => void,
) {
  rememberScrollOffset(event.nativeEvent.contentOffset.y);
}

export function ShowsScreen({
  bandId,
  now = new Date(),
  viewportHeight,
  viewportWidth,
}: BandSectionScreenProps) {
  const showsQuery = useShows(bandId);
  const songsQuery = useSongs(bandId, true);
  const { initialScrollOffset, rememberScrollOffset, state, update } =
    useSectionViewState(bandId, 'shows', {
      period: 'upcoming' as ShowPeriod,
      search: '',
      sort: 'date-asc' as ShowSort,
      status: 'active' as ShowStatusFilter,
      view: 'list' as ShowView,
    });
  const songsById = useMemo(
    () => new Map((songsQuery.data ?? []).map((song) => [song.id, song])),
    [songsQuery.data],
  );
  const normalizedSearch = normalizeForSearch(state.search);
  const shows = useMemo(() => {
    const result = (showsQuery.data ?? []).filter((show) => {
      const matchesSearch = normalizeForSearch(
        `${show.name} ${show.venue}`,
      ).includes(normalizedSearch);
      const startsAt = new Date(show.startsAt);
      const matchesPeriod =
        state.period === 'all' ||
        (state.period === 'upcoming' ? startsAt >= now : startsAt < now);
      const matchesStatus =
        state.status === 'all' ||
        (state.status === 'active'
          ? show.status === 'draft' || show.status === 'ready'
          : show.status === state.status);

      return matchesSearch && matchesPeriod && matchesStatus;
    });

    return [...result].sort((left, right) => {
      if (state.sort === 'name') {
        return left.name.localeCompare(right.name, 'pt-BR');
      }
      if (state.sort === 'duration') {
        return (
          (getShowDurationMs(right, songsById) ?? -1) -
          (getShowDurationMs(left, songsById) ?? -1)
        );
      }
      return state.sort === 'date-desc'
        ? right.startsAt.localeCompare(left.startsAt)
        : left.startsAt.localeCompare(right.startsAt);
    });
  }, [normalizedSearch, now, showsQuery.data, songsById, state]);
  const clearFilters = () => {
    update('search', '');
    update('period', 'upcoming');
    update('status', 'active');
    update('sort', 'date-asc');
  };

  const controls = (
    <ListControls>
      <SearchField
        accessibilityLabel="Buscar show por nome ou local"
        onChangeText={(value) => update('search', value)}
        placeholder="Buscar show ou local"
        value={state.search}
      />
      <ChoiceChips
        accessibilityLabel="Visualização dos shows"
        onChange={(value) => update('view', value)}
        options={showViews}
        value={state.view}
      />
      <ChoiceChips
        accessibilityLabel="Período dos shows"
        onChange={(value) => update('period', value)}
        options={showPeriods}
        value={state.period}
      />
      <View style={styles.controlFooter}>
        <ChoiceChips
          accessibilityLabel="Estado dos shows"
          onChange={(value) => update('status', value)}
          options={showStatuses}
          value={state.status}
        />
        <OptionMenu
          accessibilityLabel="Alterar ordenação dos shows"
          label="Ordenar"
          onChange={(value) => update('sort', value)}
          options={showSorts}
          value={state.sort}
        />
      </View>
    </ListControls>
  );
  const hasQuery =
    state.search.length > 0 ||
    state.period !== 'upcoming' ||
    state.status !== 'active';

  return (
    <BandAreaLayout
      activeSection="shows"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'shows') as string}
      fixedContent={controls}
      scrollable={false}
      title="Shows"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      <LoadingState isPending={showsQuery.isPending || songsQuery.isPending} />
      <ErrorState isError={showsQuery.isError || songsQuery.isError} />

      {state.view === 'list' ? (
        <FlatList
          contentContainerStyle={styles.listContent}
          contentOffset={{ x: 0, y: initialScrollOffset }}
          data={shows}
          keyExtractor={({ id }) => id}
          ListEmptyComponent={
            !showsQuery.isPending && !songsQuery.isPending ? (
              <ListEmptyState
                actionLabel={hasQuery ? 'Limpar filtros' : undefined}
                message={
                  hasQuery
                    ? 'Nem o roadie encontrou essa. Tente outra busca.'
                    : 'A agenda ainda está em silêncio. Que tal marcar o próximo show?'
                }
                onAction={hasQuery ? clearFilters : undefined}
                title={
                  hasQuery ? 'Nenhum show encontrado' : 'Nenhum show por aqui'
                }
              />
            ) : null
          }
          onScroll={(event) => onListScroll(event, rememberScrollOffset)}
          renderItem={({ item }) => (
            <ShowRow
              bandId={bandId}
              durationMs={getShowDurationMs(item, songsById)}
              show={item}
            />
          )}
          scrollEventThrottle={120}
          showsVerticalScrollIndicator={false}
          testID="shows-list"
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.calendarContent}
          showsVerticalScrollIndicator={false}
        >
          <MonthCalendar
            initialDate={now}
            renderShow={(show) => (
              <ShowRow
                bandId={bandId}
                durationMs={getShowDurationMs(show, songsById)}
                show={show}
              />
            )}
            shows={shows}
          />
        </ScrollView>
      )}
    </BandAreaLayout>
  );
}

export function RepertoireScreen({
  bandId,
  viewportHeight,
  viewportWidth,
}: BandSectionScreenProps) {
  const songsQuery = useSongs(bandId, true);
  const { initialScrollOffset, rememberScrollOffset, state, update } =
    useSectionViewState(bandId, 'repertoire', {
      filter: 'all' as RepertoireFilter,
      search: '',
      sort: 'title' as RepertoireSort,
    });
  const normalizedSearch = normalizeForSearch(state.search);
  const songs = useMemo(() => {
    const result = (songsQuery.data ?? []).filter((song) => {
      const matchesSearch = normalizeForSearch(
        `${song.title} ${song.originalArtist ?? ''}`,
      ).includes(normalizedSearch);
      const matchesFilter =
        state.filter === 'archived'
          ? song.archivedAt !== null
          : song.archivedAt === null &&
            (state.filter === 'all' ||
              (state.filter === 'synchronized'
                ? song.lyricStatus === 'synchronized'
                : song.lyricStatus !== 'synchronized'));

      return matchesSearch && matchesFilter;
    });

    return [...result].sort((left, right) => {
      if (state.sort === 'artist') {
        return (left.originalArtist ?? '').localeCompare(
          right.originalArtist ?? '',
          'pt-BR',
        );
      }
      if (state.sort === 'updated') {
        return right.updatedAt.localeCompare(left.updatedAt);
      }
      if (state.sort === 'duration') {
        return (
          (right.estimatedDurationMs ?? -1) - (left.estimatedDurationMs ?? -1)
        );
      }
      return left.title.localeCompare(right.title, 'pt-BR');
    });
  }, [normalizedSearch, songsQuery.data, state]);
  const hasQuery = state.search.length > 0 || state.filter !== 'all';
  const clearFilters = () => {
    update('search', '');
    update('filter', 'all');
    update('sort', 'title');
  };

  return (
    <BandAreaLayout
      activeSection="repertoire"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'repertoire') as string}
      fixedContent={
        <ListControls>
          <SearchField
            accessibilityLabel="Buscar música por título ou artista"
            onChangeText={(value) => update('search', value)}
            placeholder="Buscar música ou artista/banda"
            value={state.search}
          />
          <View style={styles.controlFooter}>
            <ChoiceChips
              accessibilityLabel="Estado das músicas"
              onChange={(value) => update('filter', value)}
              options={repertoireFilters}
              value={state.filter}
            />
            <OptionMenu
              accessibilityLabel="Alterar ordenação do repertório"
              label="Ordenar"
              onChange={(value) => update('sort', value)}
              options={repertoireSorts}
              value={state.sort}
            />
          </View>
        </ListControls>
      }
      scrollable={false}
      title="Repertório"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      <LoadingState isPending={songsQuery.isPending} />
      <ErrorState isError={songsQuery.isError} />
      <FlatList
        contentContainerStyle={styles.listContent}
        contentOffset={{ x: 0, y: initialScrollOffset }}
        data={songs}
        keyExtractor={({ id }) => id}
        ListEmptyComponent={
          !songsQuery.isPending ? (
            <ListEmptyState
              actionLabel={hasQuery ? 'Limpar filtros' : undefined}
              message={
                hasQuery
                  ? 'Nem o roadie encontrou essa. Tente outra busca.'
                  : 'O palco está silencioso por aqui. Que tal adicionar a primeira música?'
              }
              onAction={hasQuery ? clearFilters : undefined}
              title={
                hasQuery ? 'Nenhuma música encontrada' : 'Repertório vazio'
              }
            />
          ) : null
        }
        onScroll={(event) => onListScroll(event, rememberScrollOffset)}
        renderItem={({ item }) => <SongRow bandId={bandId} song={item} />}
        scrollEventThrottle={120}
        showsVerticalScrollIndicator={false}
        testID="repertoire-list"
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
  const userBandsQuery = useUserBands();
  const currentMembership = userBandsQuery.data?.find(
    ({ band }) => band.id === bandId,
  )?.membership;
  const canManage = currentMembership?.role === 'owner';
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);
  const { initialScrollOffset, rememberScrollOffset } = useSectionViewState(
    bandId,
    'band',
    { view: 'members' },
  );
  const sections = useMemo(
    () =>
      (['owner', 'editor', 'member'] as const).map((role) => ({
        data: [...(membersQuery.data ?? [])]
          .filter((member) => member.role === role)
          .sort((left, right) =>
            left.displayName.localeCompare(right.displayName, 'pt-BR'),
          ),
        role,
        title: roleGroupLabels[role],
      })),
    [membersQuery.data],
  );

  return (
    <BandAreaLayout
      activeSection="band"
      bandId={bandId}
      currentRoute={getBandSectionHref(bandId, 'band') as string}
      headerAction={
        canManage
          ? {
              accessibilityLabel: 'Convidar integrante',
              label: 'Convidar',
              onPress: () =>
                setPreviewNotice(
                  'Os convites entram com o controle de acesso. A posição do botão já está no palco.',
                ),
            }
          : undefined
      }
      scrollable={false}
      title="Banda"
      viewportHeight={viewportHeight}
      viewportWidth={viewportWidth}
    >
      <LoadingState isPending={membersQuery.isPending} />
      <ErrorState isError={membersQuery.isError || userBandsQuery.isError} />
      <SectionList
        contentContainerStyle={styles.listContent}
        contentOffset={{ x: 0, y: initialScrollOffset }}
        keyExtractor={(member) => member.id}
        ListHeaderComponent={
          previewNotice ? (
            <View accessibilityLiveRegion="polite" style={styles.demoNotice}>
              <AppText>{previewNotice}</AppText>
              <Pressable
                accessibilityLabel="Fechar aviso de demonstração"
                accessibilityRole="button"
                onPress={() => setPreviewNotice(null)}
              >
                <AppText tone="accent">Fechar</AppText>
              </Pressable>
            </View>
          ) : null
        }
        onScroll={(event) => onListScroll(event, rememberScrollOffset)}
        renderItem={({ item }) => (
          <MemberRow
            canManage={canManage}
            current={item.userId === currentMembership?.userId}
            member={item}
            onManage={() =>
              setPreviewNotice(
                'A administração de integrantes será conectada ao backend em um próximo incremento.',
              )
            }
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.groupHeader}>
            <AppText tone="accent" variant="eyebrow">
              {section.title} · {section.data.length}
            </AppText>
          </View>
        )}
        scrollEventThrottle={120}
        sections={sections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled
        testID="band-members-list"
      />
    </BandAreaLayout>
  );
}

function MemberRow({
  canManage,
  current,
  member,
  onManage,
}: {
  readonly canManage: boolean;
  readonly current: boolean;
  readonly member: BandMember;
  readonly onManage: () => void;
}) {
  const initials = member.displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR');

  return (
    <View style={styles.rowFrame}>
      <View style={styles.memberRow}>
        <View style={styles.memberAvatar}>
          <AppText tone="accent" variant="caption">
            {initials}
          </AppText>
        </View>
        <View style={styles.rowCopy}>
          <View style={styles.rowTitleLine}>
            <AppText>{member.displayName}</AppText>
            {current ? <StatusPill tone="ready">Você</StatusPill> : null}
          </View>
          <AppText tone="muted" variant="caption">
            {roleLabels[member.role]}
          </AppText>
        </View>
        {canManage && !current ? (
          <Pressable
            accessibilityLabel={`Administrar ${member.displayName}`}
            accessibilityRole="button"
            onPress={onManage}
            style={({ pressed }) => [
              styles.overflowButton,
              pressed && styles.pressed,
            ]}
          >
            <AppText tone="accent">•••</AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export { formatShowDate, lyricStatusLabels, showStatusLabels };

const styles = StyleSheet.create({
  feedback: {
    margin: spacing.xl,
    textAlign: 'center',
  },
  controlFooter: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  calendarContent: {
    padding: spacing.xl,
  },
  rowFrame: {
    alignSelf: 'center',
    maxWidth: layout.contentMaxWidth,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  listRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 78,
    padding: spacing.md,
  },
  cancelledRow: {
    opacity: 0.66,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  rowTitleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rowTitle: {
    flexShrink: 1,
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    minWidth: 76,
  },
  pill: {
    backgroundColor: colors.violetSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  readyPill: {
    backgroundColor: colors.cyanSoft,
  },
  warningPill: {
    backgroundColor: '#fef3c7',
  },
  groupHeader: {
    alignSelf: 'center',
    backgroundColor: colors.paper,
    maxWidth: layout.contentMaxWidth,
    paddingBottom: spacing.sm,
    paddingTop: spacing.lg,
    width: '100%',
  },
  memberRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 68,
    padding: spacing.md,
  },
  memberAvatar: {
    alignItems: 'center',
    backgroundColor: colors.violetSoft,
    borderRadius: radii.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  overflowButton: {
    alignItems: 'center',
    height: layout.minimumTouchTarget,
    justifyContent: 'center',
    width: layout.minimumTouchTarget,
  },
  demoNotice: {
    alignItems: 'center',
    backgroundColor: colors.cyanSoft,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
});
