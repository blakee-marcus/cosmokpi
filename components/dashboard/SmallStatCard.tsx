import { memo } from 'react';

export const SmallStatCard = memo(function SmallStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className='group h-full rounded-[28px] border-2 border-cosmo-black bg-cosmo-black p-5 text-cosmo-white shadow-[5px_6px_0_0_rgba(17,17,17,0.22)] transition-transform duration-200 hover:-translate-y-0.5'>
      <p className='font-tag text-sm font-black uppercase leading-none text-cosmo-white/70'>
        {label}
      </p>

      <p className='font-display mt-3 text-4xl font-black leading-none tabular-nums text-cosmo-white'>
        {value}
      </p>

      <div className='mt-4 h-1.5 w-14 rounded-full bg-primary-web-red' />

      <p className='mt-4 text-sm font-semibold leading-6 text-cosmo-white/75'>{detail}</p>
    </article>
  );
});
