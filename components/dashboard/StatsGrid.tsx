import { formatNumber, shortDateFormatter } from '@/lib/dashboard/formatters';
import type { DashboardPeriod } from '@/lib/dashboard/types';
import { SmallStatCard } from './SmallStatCard';

function getPeriodSourceFiles(selectedPeriod: DashboardPeriod) {
  return selectedPeriod.weeks.flatMap((week) => {
    if (week.sourceFiles?.length) {
      return week.sourceFiles.map((sourceFile) => ({
        fileName: sourceFile.fileName,
        importedAt: sourceFile.importedAt ?? week.uploadedAt,
      }));
    }

    return [
      {
        fileName: week.fileName,
        importedAt: week.uploadedAt,
      },
    ];
  });
}

function getSourceFileDateLabel(selectedPeriod: DashboardPeriod) {
  const importedAtValues = getPeriodSourceFiles(selectedPeriod)
    .map((sourceFile) => sourceFile.importedAt)
    .filter((importedAt): importedAt is string => Boolean(importedAt));

  if (importedAtValues.length === 0) return 'Unknown';

  const latestImportedAt = importedAtValues
    .map((importedAt) => new Date(importedAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return latestImportedAt ? shortDateFormatter.format(latestImportedAt) : 'Unknown';
}

function getSourceFileLabel(selectedPeriod: DashboardPeriod) {
  const sourceFileNames = getPeriodSourceFiles(selectedPeriod)
    .map((sourceFile) => sourceFile.fileName)
    .filter(Boolean);

  const uniqueSourceFileNames = [...new Set(sourceFileNames)];

  return uniqueSourceFileNames.length > 0
    ? uniqueSourceFileNames.join(', ')
    : 'No source file listed';
}

export function StatsGrid({ selectedPeriod }: { selectedPeriod: DashboardPeriod }) {
  const isMonthly = selectedPeriod.periodType === 'monthly';

  const sourceFileDateLabel = getSourceFileDateLabel(selectedPeriod);
  const sourceFileLabel = getSourceFileLabel(selectedPeriod);

  const reportCountLabel =
    selectedPeriod.includedWeekCount === 1
      ? '1 saved report'
      : `${selectedPeriod.includedWeekCount} saved reports`;

  return (
    <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      <SmallStatCard
        label='Team members'
        value={formatNumber(selectedPeriod.totals.employees)}
        detail={
          isMonthly ? 'Unique team members in this month' : 'Included in this uploaded report'
        }
      />

      <SmallStatCard
        label='Games hosted'
        value={formatNumber(selectedPeriod.totals.totalGames)}
        detail={
          isMonthly ? 'Total games across included reports' : 'Total games connected to this week'
        }
      />

      <SmallStatCard
        label='Guests served'
        value={formatNumber(selectedPeriod.totals.guests)}
        detail='Guest volume represented in the KPI rows'
      />

      <SmallStatCard
        label={isMonthly ? 'Reports included' : 'Source file'}
        value={isMonthly ? reportCountLabel : sourceFileDateLabel}
        detail={isMonthly ? selectedPeriod.includedWeekLabels.join(', ') : sourceFileLabel}
      />
    </section>
  );
}
