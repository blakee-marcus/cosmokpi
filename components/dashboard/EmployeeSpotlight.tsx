import { memo } from 'react';

import { formatNumber, formatPercent, normalizePercent } from '@/lib/dashboard/formatters';
import type { EmployeeKpiRow } from '@/lib/dashboard/types';

export const EmployeeSpotlight = memo(function EmployeeSpotlight({
  label,
  employee,
  metric,
  count,
  note,
}: {
  label: string;
  employee?: EmployeeKpiRow;
  metric: keyof EmployeeKpiRow;
  count: keyof EmployeeKpiRow;
  note: string;
}) {
  const value = employee ? normalizePercent(Number(employee[metric])) : 0;
  const countValue = employee ? Number(employee[count]) : 0;
  const hasData = Boolean(employee);

  return (
    <article className='teg-card p-5'>
      <p className='font-tag text-sm font-black uppercase tracking-wide text-primary-web-red'>
        {label}
      </p>

      <p className='font-heading mt-3 truncate text-2xl font-black text-cosmo-black'>
        {employee?.name ?? 'No qualifying data'}
      </p>

      <div className='mt-4 flex items-end justify-between gap-3'>
        <p className='font-display text-4xl font-black text-cosmo-black'>{formatPercent(value)}</p>

        <p className='pb-1 text-sm font-semibold text-ink-soft'>{formatNumber(countValue)} total</p>
      </div>

      <div className='mt-4 rounded-2xl bg-cosmo-black/[0.04] px-4 py-3'>
        <p className='text-sm font-semibold leading-6 text-ink-soft'>
          {hasData ? note : 'More qualifying data is needed before highlighting this area.'}
        </p>
      </div>
    </article>
  );
});
