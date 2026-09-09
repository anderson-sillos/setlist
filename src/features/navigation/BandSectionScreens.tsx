import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useBandMembers, useShows, useSongs } from '@/data/queries';
import type { EntityId } from '@/domain';
import { BandAreaLayout } from '@/features/navigation/BandAreaLayout';
import { spacing } from '@/theme/tokens';

interface BandSectionScreenProps {
  readonly bandId: EntityId;
}

interface SummaryCardProps {
  readonly description: string;
  readonly isError: boolean;
  readonly isPending: boolean;
  readonly title: string;
}

function SummaryCard({
  description,
  isError,
  isPending,
  title,
}: SummaryCardProps) {
  return (
    <Card style={styles.card}>
      <AppText tone="accent" variant="eyebrow">
        Primeira navegação
      </AppText>
      <AppText accessibilityRole="header" variant="heading">
        {title}
      </AppText>
      <AppText tone="muted">
        {isPending ? 'Carregando conteúdo…' : description}
      </AppText>
      {isError ? (
        <AppText accessibilityRole="alert">
          Não foi possível carregar esta área.
        </AppText>
      ) : null}
    </Card>
  );
}

export function ShowsScreen({ bandId }: BandSectionScreenProps) {
  const showsQuery = useShows(bandId);

  return (
    <BandAreaLayout activeSection="shows" bandId={bandId}>
      <SummaryCard
        description={`${showsQuery.data?.length ?? 0} shows disponíveis para consulta.`}
        isError={showsQuery.isError}
        isPending={showsQuery.isPending}
        title="Shows"
      />
    </BandAreaLayout>
  );
}

export function RepertoireScreen({ bandId }: BandSectionScreenProps) {
  const songsQuery = useSongs(bandId);

  return (
    <BandAreaLayout activeSection="repertoire" bandId={bandId}>
      <SummaryCard
        description={`${songsQuery.data?.length ?? 0} músicas ativas no repertório.`}
        isError={songsQuery.isError}
        isPending={songsQuery.isPending}
        title="Repertório"
      />
    </BandAreaLayout>
  );
}

export function BandScreen({ bandId }: BandSectionScreenProps) {
  const membersQuery = useBandMembers(bandId);

  return (
    <BandAreaLayout activeSection="band" bandId={bandId}>
      <SummaryCard
        description={`${membersQuery.data?.length ?? 0} integrantes nesta banda.`}
        isError={membersQuery.isError}
        isPending={membersQuery.isPending}
        title="Banda"
      />
    </BandAreaLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
});
