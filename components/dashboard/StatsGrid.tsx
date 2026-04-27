import { formatNumber, shortDateFormatter } from '@/lib/dashboard/formatters';
import type { StoredWeek } from '@/lib/dashboard/types';
import { SmallStatCard } from './SmallStatCard';

export function StatsGrid({ selectedWeek }: { selectedWeek: StoredWeek }) {
  const importedAt = selectedWeek.importedAt ?? selectedWeek.uploadedAt;

  const sourceFileDateLabel = importedAt
    ? shortDateFormatter.format(new Date(importedAt))
    : 'Unknown';

  const sourceFileLabel =
    selectedWeek.sourceFiles?.map(({ fileName }) => fileName).join(', ') ??
    selectedWeek.fileName ??
    'No source file listed';

  return (
    <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      <SmallStatCard
        label='Team members'
        value={formatNumber(selectedWeek.totals.employees)}
        detail='Included in this uploaded report'
      />

      <SmallStatCard
        label='Games hosted'
        value={formatNumber(selectedWeek.totals.totalGames)}
        detail='Total games connected to this week'
      />

      <SmallStatCard
        label='Guests served'
        value={formatNumber(selectedWeek.totals.guests)}
        detail='Guest volume represented in the KPI rows'
      />

      <SmallStatCard label='Source file' value={sourceFileDateLabel} detail={sourceFileLabel} />
    </section>
  );
}
