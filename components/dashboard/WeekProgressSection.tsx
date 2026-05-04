import { memo } from 'react';

import { formatPercent, formatPointDelta } from '@/lib/dashboard/formatters';
import {
  getProgressClasses,
  getProgressLabel,
  getProgressStatus,
  getProgressSummary,
} from '@/lib/dashboard/metrics';
import type { DashboardPeriod, WeekProgressMetric } from '@/lib/dashboard/types';

type WeekProgressSectionProps = Readonly<{
  selectedPeriod: DashboardPeriod;
  previousPeriod: DashboardPeriod | null;
  metrics: WeekProgressMetric[];
}>;

type ProgressSummary = NonNullable<ReturnType<typeof getProgressSummary>>;

type SummaryStatProps = Readonly<{
  label: string;
  value: number;
  tone: 'green' | 'yellow' | 'red';
}>;

type SummaryCardProps = Readonly<{
  label: string;
  metric?: WeekProgressMetric | null;
  fallback: string;
}>;

type ProgressSummaryStatsProps = Readonly<{
  progressSummary: ProgressSummary;
}>;

type ProgressComparisonPanelProps = Readonly<{
  metrics: WeekProgressMetric[];
  progressSummary: ProgressSummary;
  periodName: string;
}>;

const BORDER_ROW_CLASS = 'border-b-2 border-cosmo-black/5';

function getRowBorderClass(isLastRow: boolean) {
  return isLastRow ? '' : BORDER_ROW_CLASS;
}

function SummaryStat({ label, value, tone }: SummaryStatProps) {
  const toneClass = {
    green: 'text-kpi-green',
    yellow: 'text-yellow',
    red: 'text-kpi-red',
  }[tone];

  return (
    <div className='rounded-[16px] border border-cosmo-black/5 bg-cosmo-white p-3'>
      <p className={`font-display text-2xl font-black ${toneClass}`}>{value}</p>
      <p className='font-tag text-[11px] font-black uppercase text-ink-soft'>{label}</p>
    </div>
  );
}

function SummaryCard({ label, metric, fallback }: SummaryCardProps) {
  const status = metric ? getProgressStatus(metric.delta) : null;
  const pillClass = status ? getProgressClasses(status).pill : 'bg-cosmo-white text-cosmo-black';

  return (
    <div className='rounded-[18px] border border-cosmo-white/10 bg-cosmo-white/10 p-4'>
      <p className='font-tag text-xs font-black uppercase text-cosmo-white/60'>{label}</p>
      <p className='mt-1 font-heading text-lg font-black'>{metric?.label ?? fallback}</p>
      <p
        className={`font-tag mt-2 inline-flex h-7 items-center justify-center whitespace-nowrap rounded-[12px] px-3 text-xs font-black leading-none ${pillClass}`}>
        {metric ? formatPointDelta(metric.delta) : '0.0 pts'}
      </p>
    </div>
  );
}

function ProgressSummaryStats({ progressSummary }: ProgressSummaryStatsProps) {
  return (
    <div className='grid grid-cols-3 gap-2 text-center sm:min-w-[360px]'>
      <SummaryStat label='Improved' value={progressSummary.improvedCount} tone='green' />
      <SummaryStat label='Steady' value={progressSummary.steadyCount} tone='yellow' />
      <SummaryStat label='Follow-up' value={progressSummary.needsFollowUpCount} tone='red' />
    </div>
  );
}

function EmptyProgressState({ periodName, storeName }: { periodName: string; storeName: string }) {
  return (
    <div className='p-5'>
      <div className='rounded-[24px] border-2 border-dashed border-cosmo-black/20 bg-cosmo-white p-6'>
        <p className='font-heading text-xl font-black text-cosmo-black'>
          No prior {periodName} yet
        </p>
        <p className='mt-2 max-w-2xl text-sm font-medium leading-6 text-ink-soft'>
          Add another saved {periodName} for {storeName} to compare KPI movement and identify the next
          leadership follow-up.
        </p>
      </div>
    </div>
  );
}

function ProgressTable({ metrics }: { metrics: WeekProgressMetric[] }) {
  return (
    <div className='rounded-[24px] border-2 border-cosmo-black/10 bg-cosmo-white p-0.5'>
      <div className='overflow-hidden rounded-[21px]'>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm'>
            <thead className='bg-blue font-tag text-xs uppercase text-cosmo-white'>
              <tr>
                <th className='px-4 py-3 font-black'>KPI</th>
                <th className='px-4 py-3 font-black'>This week</th>
                <th className='px-4 py-3 font-black'>Prior</th>
                <th className='px-4 py-3 font-black'>Change</th>
                <th className='px-4 py-3 font-black'>Goal</th>
              </tr>
            </thead>

            <tbody className='bg-cosmo-white'>
              {metrics.map((metric, index) => {
                const status = getProgressStatus(metric.delta);
                const classes = getProgressClasses(status);
                const rowBorderClass = getRowBorderClass(index === metrics.length - 1);

                return (
                  <tr key={metric.label} className='transition-colors hover:bg-comic-fog'>
                    <td className={`px-4 py-4 ${rowBorderClass}`}>
                      <p className='font-heading text-base font-black text-cosmo-black'>
                        {metric.label}
                      </p>
                      <p className='mt-1 text-xs font-semibold leading-5 text-ink-soft'>
                        {metric.detail}
                      </p>
                    </td>

                    <td
                      className={`px-4 py-4 font-display text-xl font-black tabular-nums text-cosmo-black ${rowBorderClass}`}>
                      {formatPercent(metric.value)}
                    </td>

                    <td
                      className={`px-4 py-4 font-display text-xl font-black tabular-nums text-cosmo-black ${rowBorderClass}`}>
                      {formatPercent(metric.previousValue)}
                    </td>

                    <td className={`px-4 py-4 ${rowBorderClass}`}>
                      <span
                        className={`font-tag inline-flex h-7 items-center justify-center whitespace-nowrap rounded-[12px] px-3 text-xs font-black leading-none ${classes.pill}`}>
                        {formatPointDelta(metric.delta)}
                      </span>
                      <p className='mt-2 text-xs font-black text-ink-soft'>
                        {getProgressLabel(status)}
                      </p>
                    </td>

                    <td
                      className={`px-4 py-4 font-black tabular-nums text-cosmo-black ${rowBorderClass}`}>
                      {formatPercent(metric.goal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProgressComparisonPanel({
  metrics,
  periodName,
  progressSummary,
}: ProgressComparisonPanelProps) {
  return (
    <div className='grid gap-5 p-5 xl:grid-cols-[0.72fr_1.28fr]'>
      <aside className='relative h-full min-w-0 rounded-[28px]'>
        <div
          aria-hidden='true'
          className='absolute inset-0 translate-x-[5px] translate-y-[6px] rounded-[28px] bg-cosmo-black/15'
        />

        <div className='relative h-full overflow-hidden rounded-[28px] bg-cosmo-black p-5 text-cosmo-white'>
          <p className='font-tag text-sm font-black uppercase text-cosmo-white/70'>
            Leadership read
          </p>

          <p className='mt-3 font-display text-4xl font-black'>
            {progressSummary.improvedCount} of {metrics.length}
          </p>

          <p className='mt-2 text-sm font-semibold leading-6 text-cosmo-white/80'>
            store KPIs improved compared with the prior saved {periodName}.
          </p>

          <div className='mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1'>
            <SummaryCard
              label='Strongest gain'
              metric={progressSummary.strongestGain}
              fallback='No gain yet'
            />

            <SummaryCard
              label='Priority follow-up'
              metric={progressSummary.priorityFollowUp}
              fallback='No follow-up yet'
            />
          </div>
        </div>
      </aside>

      <ProgressTable metrics={metrics} />
    </div>
  );
}

export const WeekProgressSection = memo(function WeekProgressSection({
  selectedPeriod,
  previousPeriod,
  metrics,
}: WeekProgressSectionProps) {
  const progressSummary = previousPeriod ? getProgressSummary(metrics) : null;
  const periodName = selectedPeriod.periodType === 'monthly' ? 'month' : 'week';
  const periodLabel = selectedPeriod.periodType === 'monthly' ? 'Month-to-month' : 'Week-to-week';

  return (
    <section className='snappy-section teg-card overflow-hidden text-cosmo-black'>
      <div className='border-b-2 border-cosmo-black/10 bg-comic-fog/70 px-5 py-6 sm:px-6 lg:px-7'>
        <div className='grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end'>
          <div className='max-w-3xl'>
            <div className='inline-flex rounded-full border-2 border-primary-web-red/15 bg-cosmo-white px-3 py-1'>
              <p className='font-tag text-xs font-black uppercase tracking-wide text-primary-web-red'>
                {periodLabel} progress
              </p>
            </div>

            <h2 className='mt-4 font-heading text-2xl font-black leading-tight sm:text-3xl'>
              {previousPeriod
                ? `${selectedPeriod.periodLabel} vs ${previousPeriod.periodLabel}`
                : `Build the next ${periodName}ly comparison`}
            </h2>

            <p className='mt-2 text-sm font-medium leading-6 text-ink-soft sm:text-base'>
              {previousPeriod
                ? `Review ${selectedPeriod.storeName} movement across saved KPI reports and identify where leadership follow-through is needed next.`
                : `Add another saved ${periodName} for ${selectedPeriod.storeName} to unlock KPI movement, trend context, and follow-up priorities.`}
            </p>
          </div>

          {progressSummary ? (
            <div className='rounded-[24px] border-2 border-cosmo-black/10 bg-cosmo-white p-4 shadow-[4px_5px_0_0_rgba(0,0,0,0.07)]'>
              <ProgressSummaryStats progressSummary={progressSummary} />
            </div>
          ) : null}
        </div>
      </div>

      <div className='bg-cosmo-white p-5 sm:p-6 lg:p-7'>
        {progressSummary ? (
          <ProgressComparisonPanel
            metrics={metrics}
            periodName={periodName}
            progressSummary={progressSummary}
          />
        ) : (
          <EmptyProgressState periodName={periodName} storeName={selectedPeriod.storeName} />
        )}
      </div>
    </section>
  );
});
