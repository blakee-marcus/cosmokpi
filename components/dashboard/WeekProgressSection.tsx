import { memo } from 'react';

import { formatPercent, formatPointDelta } from '@/lib/dashboard/formatters';
import {
  getProgressClasses,
  getProgressLabel,
  getProgressStatus,
  getProgressSummary,
} from '@/lib/dashboard/metrics';
import type { StoredWeek, WeekProgressMetric } from '@/lib/dashboard/types';

export const WeekProgressSection = memo(function WeekProgressSection({
  selectedWeek,
  previousWeek,
  metrics,
}: {
  selectedWeek: StoredWeek;
  previousWeek: StoredWeek | null;
  metrics: WeekProgressMetric[];
}) {
  const progressSummary = previousWeek ? getProgressSummary(metrics) : null;
  const strongestGainStatus = progressSummary?.strongestGain
    ? getProgressStatus(progressSummary.strongestGain.delta)
    : null;
  const priorityStatus = progressSummary?.priorityFollowUp
    ? getProgressStatus(progressSummary.priorityFollowUp.delta)
    : null;

  return (
    <section className='snappy-section rounded-[30px] border-2 border-cosmo-black/10 bg-cosmo-white text-cosmo-black shadow-[6px_7px_0_0_rgba(0,0,0,0.10)]'>
      <div className='rounded-t-[28px] border-b-2 border-cosmo-black/10 bg-comic-fog p-5'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <p className='font-tag text-sm font-black uppercase text-primary-web-red'>
              Week-to-week progress
            </p>
            <h2 className='font-heading mt-2 text-2xl font-black'>
              {previousWeek
                ? `${selectedWeek.weekLabel} vs ${previousWeek.weekLabel}`
                : 'Build the next weekly comparison'}
            </h2>
            <p className='mt-1 max-w-3xl text-sm font-medium leading-6 text-ink-soft'>
              {previousWeek
                ? `A compact readout for ${selectedWeek.storeName} movement across the saved KPI reports.`
                : `Add another saved week for ${selectedWeek.storeName} to see progress.`}
            </p>
          </div>

          {previousWeek && progressSummary ? (
            <div className='grid grid-cols-3 gap-2 text-center sm:min-w-[360px]'>
              <div className='rounded-[16px] border border-cosmo-black/5 bg-cosmo-white p-3'>
                <p className='font-display text-2xl font-black text-kpi-green'>
                  {progressSummary.improvedCount}
                </p>
                <p className='font-tag text-[11px] font-black uppercase text-ink-soft'>Improved</p>
              </div>
              <div className='rounded-[16px] border border-cosmo-black/5 bg-cosmo-white p-3'>
                <p className='font-display text-2xl font-black text-[#7A5A00]'>
                  {progressSummary.steadyCount}
                </p>
                <p className='font-tag text-[11px] font-black uppercase text-ink-soft'>Steady</p>
              </div>
              <div className='rounded-[16px] border border-cosmo-black/5 bg-cosmo-white p-3'>
                <p className='font-display text-2xl font-black text-kpi-red'>
                  {progressSummary.needsFollowUpCount}
                </p>
                <p className='font-tag text-[11px] font-black uppercase text-ink-soft'>Follow-up</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {previousWeek ? (
        <div className='grid gap-5 p-5 xl:grid-cols-[0.72fr_1.28fr]'>
          <div className='rounded-[24px] bg-cosmo-black p-5 text-cosmo-white shadow-[5px_6px_0_0_rgba(0,0,0,0.14)]'>
            <p className='font-tag text-sm font-black uppercase text-cosmo-white/70'>Quick read</p>
            <p className='font-display mt-3 text-4xl font-black'>
              {progressSummary?.improvedCount ?? 0} of {metrics.length}
            </p>
            <p className='mt-2 text-sm font-semibold leading-6 text-cosmo-white/80'>
              store KPIs improved compared with the prior saved week.
            </p>

            <div className='mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1'>
              <div className='rounded-[18px] border border-cosmo-white/10 bg-cosmo-white/10 p-4'>
                <p className='font-tag text-xs font-black uppercase text-cosmo-white/60'>
                  Strongest gain
                </p>
                <p className='mt-1 font-heading text-lg font-black'>
                  {progressSummary?.strongestGain?.label ?? 'No gain yet'}
                </p>
                <p
                  className={`font-tag mt-2 inline-flex h-7 items-center justify-center whitespace-nowrap rounded-[12px] px-3 text-xs font-black leading-none ${
                    strongestGainStatus
                      ? getProgressClasses(strongestGainStatus).pill
                      : 'bg-cosmo-white text-cosmo-black'
                  }`}>
                  {progressSummary?.strongestGain
                    ? formatPointDelta(progressSummary.strongestGain.delta)
                    : '0.0 pts'}
                </p>
              </div>

              <div className='rounded-[18px] border border-cosmo-white/10 bg-cosmo-white/10 p-4'>
                <p className='font-tag text-xs font-black uppercase text-cosmo-white/60'>
                  Priority follow-up
                </p>
                <p className='mt-1 font-heading text-lg font-black'>
                  {progressSummary?.priorityFollowUp?.label ?? 'No follow-up yet'}
                </p>
                <p
                  className={`font-tag mt-2 inline-flex h-7 items-center justify-center whitespace-nowrap rounded-[12px] px-3 text-xs font-black leading-none ${
                    priorityStatus
                      ? getProgressClasses(priorityStatus).pill
                      : 'bg-cosmo-white text-cosmo-black'
                  }`}>
                  {progressSummary?.priorityFollowUp
                    ? formatPointDelta(progressSummary.priorityFollowUp.delta)
                    : '0.0 pts'}
                </p>
              </div>
            </div>
          </div>

          <div className='rounded-[24px] border-2 border-cosmo-black/10 bg-cosmo-white p-0.5'>
            <div className='overflow-hidden rounded-[21px]'>
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm'>
                  <thead className='font-tag bg-blue text-xs uppercase text-cosmo-white'>
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
                      const isLastRow = index === metrics.length - 1;

                      return (
                        <tr key={metric.label} className='transition hover:bg-comic-fog'>
                          <td
                            className={`px-4 py-4 ${
                              isLastRow ? '' : 'border-b-2 border-cosmo-black/5'
                            }`}>
                            <p className='font-heading text-base font-black text-cosmo-black'>
                              {metric.label}
                            </p>
                            <p className='mt-1 text-xs font-semibold leading-5 text-ink-soft'>
                              {metric.detail}
                            </p>
                          </td>
                          <td
                            className={`px-4 py-4 font-display text-xl font-black tabular-nums text-cosmo-black ${
                              isLastRow ? '' : 'border-b-2 border-cosmo-black/5'
                            }`}>
                            {formatPercent(metric.value)}
                          </td>
                          <td
                            className={`px-4 py-4 font-display text-xl font-black tabular-nums text-cosmo-black ${
                              isLastRow ? '' : 'border-b-2 border-cosmo-black/5'
                            }`}>
                            {formatPercent(metric.previousValue)}
                          </td>
                          <td
                            className={`px-4 py-4 ${
                              isLastRow ? '' : 'border-b-2 border-cosmo-black/5'
                            }`}>
                            <span
                              className={`font-tag inline-flex h-7 items-center justify-center whitespace-nowrap rounded-[12px] px-3 text-xs font-black leading-none ${classes.pill}`}>
                              {formatPointDelta(metric.delta)}
                            </span>
                            <p className='mt-2 text-xs font-black text-ink-soft'>
                              {getProgressLabel(status)}
                            </p>
                          </td>
                          <td
                            className={`px-4 py-4 font-black tabular-nums text-cosmo-black ${
                              isLastRow ? '' : 'border-b-2 border-cosmo-black/5'
                            }`}>
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
        </div>
      ) : (
        <div className='p-5'>
          <div className='rounded-[24px] border-2 border-dashed border-cosmo-black/20 bg-cosmo-white p-6'>
            <p className='font-heading text-xl font-black text-cosmo-black'>No prior week yet</p>
            <p className='mt-2 max-w-2xl text-sm font-medium leading-6 text-ink-soft'>
              Add another saved week for this store to see progress.
            </p>
          </div>
        </div>
      )}
    </section>
  );
});
