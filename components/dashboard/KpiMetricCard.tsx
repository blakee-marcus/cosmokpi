import { memo } from 'react';

import { formatPercent } from '@/lib/dashboard/formatters';
import { getGoalStatus, getStatusClasses, getStatusLabel } from '@/lib/dashboard/metrics';
import type { KpiCard } from '@/lib/dashboard/types';

function getProgressWidth(metric: KpiCard) {
  if (!Number.isFinite(metric.goal) || metric.goal <= 0) return 0;

  return Math.min(Math.max((metric.value / metric.goal) * 100, 0), 100);
}

export const KpiMetricCard = memo(function KpiMetricCard({ metric }: { metric: KpiCard }) {
  const status = getGoalStatus(metric.value, metric.goal, metric.direction);
  const classes = getStatusClasses(status);
  const progress = getProgressWidth(metric);

  return (
    <article
      className={`relative flex min-h-[250px] flex-col overflow-hidden rounded-[30px] border-2 p-5 shadow-teg-card-soft transition-transform duration-200 hover:-translate-y-0.5 ${classes.card}`}>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <p className='font-tag text-xs font-black uppercase leading-5 tracking-wide opacity-75'>
            {metric.label}
          </p>

          <p className='mt-3 font-display text-[2.75rem] font-black leading-none tabular-nums'>
            {formatPercent(metric.value)}
          </p>
        </div>

        <span
          className={`font-tag inline-flex min-h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-cosmo-black/10 px-3 text-[11px] font-black uppercase leading-none shadow-[2px_3px_0_0_rgba(0,0,0,0.10)] ${classes.pill}`}>
          {getStatusLabel(status)}
        </span>
      </div>

      <div className='mt-5 rounded-full border border-cosmo-black/10 bg-cosmo-white/80 p-1 shadow-inner'>
        <div
          role='progressbar'
          aria-label={`${metric.label} progress toward goal`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className='h-3 overflow-hidden rounded-full bg-cosmo-black/5'>
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${classes.bar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className='mt-4 text-sm font-semibold leading-6 opacity-80'>{metric.detail}</p>

      <div className='mt-auto pt-5'>
        <p className='font-tag inline-flex rounded-full border border-cosmo-black/10 bg-cosmo-white/70 px-3 py-1.5 text-xs font-black uppercase opacity-75'>
          Goal: {formatPercent(metric.goal)}
        </p>
      </div>
    </article>
  );
});
