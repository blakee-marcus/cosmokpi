import * as m from 'motion/react-m';

import { formatNumber, shortDateFormatter } from '@/lib/dashboard/formatters';
import type { DashboardPeriod } from '@/lib/dashboard/types';
import { listContainer, listItem } from '@/lib/motion';
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

  if (!importedAtValues.length) return 'Unknown';

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

  return uniqueSourceFileNames.length ? uniqueSourceFileNames.join(', ') : 'No source file listed';
}

function getReportCountLabel(selectedPeriod: DashboardPeriod) {
  return selectedPeriod.includedWeekCount === 1
    ? '1 report'
    : `${selectedPeriod.includedWeekCount} reports`;
}

export function StatsGrid({ selectedPeriod }: { selectedPeriod: DashboardPeriod }) {
  const isMonthly = selectedPeriod.periodType === 'monthly';
  const sourceFileDateLabel = getSourceFileDateLabel(selectedPeriod);
  const sourceFileLabel = getSourceFileLabel(selectedPeriod);

  return (
    <m.section
      layout
      variants={listContainer}
      aria-label='Report summary'
      className='snappy-section grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      <m.div layout variants={listItem}>
        <SmallStatCard
          label='Team members'
          value={formatNumber(selectedPeriod.totals.employees)}
          detail={isMonthly ? 'Unique team members this month' : 'Team members in this report'}
        />
      </m.div>

      <m.div layout variants={listItem}>
        <SmallStatCard
          label='Games hosted'
          value={formatNumber(selectedPeriod.totals.totalGames)}
          detail={isMonthly ? 'Total games from included reports' : 'Games from this report'}
        />
      </m.div>

      <m.div layout variants={listItem}>
        <SmallStatCard
          label='Guests served'
          value={formatNumber(selectedPeriod.totals.guests)}
          detail='Guest volume included in this report'
        />
      </m.div>

      <m.div layout variants={listItem}>
        <SmallStatCard
          label={isMonthly ? 'Reports included' : 'Uploaded report'}
          value={isMonthly ? getReportCountLabel(selectedPeriod) : sourceFileDateLabel}
          detail={isMonthly ? selectedPeriod.includedWeekLabels.join(', ') : sourceFileLabel}
        />
      </m.div>
    </m.section>
  );
}
