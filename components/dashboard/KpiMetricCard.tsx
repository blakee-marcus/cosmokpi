import { memo } from 'react';

import { formatPercent } from '@/lib/dashboard/formatters';
import { getGoalStatus, getStatusClasses, getStatusLabel } from '@/lib/dashboard/metrics';
import type { KpiCard } from '@/lib/dashboard/types';

export const KpiMetricCard = memo(function KpiMetricCard({ metric }: { metric: KpiCard }) {
  const status = getGoalStatus(metric.value, metric.goal, metric.direction);
  const classes = getStatusClasses(status);
  const progress = metric.goal ? Math.min((metric.value / metric.goal) * 100, 100) : 0;

  return (
    <article className={`flex min-h-[245px] flex-col rounded-[26px] border-2 p-5 ${classes.card}`}>
      <div className='flex min-h-[92px] flex-col justify-between gap-3'>
        <div className='flex items-start justify-between gap-3'>
          <p className='font-tag max-w-[11rem] text-xs font-black uppercase leading-5 opacity-75'>
            {metric.label}
          </p>

          <span
            className={`font-tag inline-flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-[12px] px-3 text-[11px] font-black leading-none ${classes.pill}`}>
            {getStatusLabel(status)}
          </span>
        </div>

        <p className='font-display text-[2.65rem] font-black leading-none tracking-tight'>
          {formatPercent(metric.value)}
        </p>
      </div>

      <div className='mt-5 h-3 overflow-hidden rounded-full border border-cosmo-black/10 bg-cosmo-white/80'>
        <div className={`h-full rounded-full ${classes.bar}`} style={{ width: `${progress}%` }} />
      </div>

      <p className='mt-4 min-h-[48px] text-sm font-medium leading-6 opacity-80'>{metric.detail}</p>

      <p className='font-tag mt-auto pt-4 text-xs font-black uppercase opacity-70'>
        Goal: {formatPercent(metric.goal)}
      </p>
    </article>
  );
});
