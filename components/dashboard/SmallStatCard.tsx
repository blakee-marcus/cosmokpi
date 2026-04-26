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
    <article className='rounded-[28px] bg-cosmo-black p-5 text-cosmo-white shadow-[6px_7px_0_0_rgba(0,0,0,0.16)]'>
      <p className='font-tag text-sm font-black uppercase text-cosmo-white/70'>{label}</p>
      <p className='font-display mt-2 text-3xl font-black'>{value}</p>
      <p className='mt-2 text-sm font-medium leading-6 text-cosmo-white/70'>{detail}</p>
    </article>
  );
});
