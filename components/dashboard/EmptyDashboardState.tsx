import Link from 'next/link';
import * as m from 'motion/react-m';

import { panelIn } from '@/lib/motion';

export function EmptyDashboardState() {
  return (
    <>
      <main className='flex min-h-[calc(100dvh-82px)] items-center justify-center bg-off-white px-5 py-10 text-cosmo-black'>
        <m.section
          variants={panelIn}
          initial={false}
          animate='visible'
          className='teg-panel w-full max-w-2xl p-8 text-center'>
          <div className='font-display mx-auto mb-6 flex size-16 items-center justify-center rounded-[22px] bg-primary-web-red text-3xl font-black text-cosmo-white shadow-teg-button-red'>
            ↑
          </div>
          <h1 className='font-heading text-4xl font-black'>No KPI data yet</h1>
          <p className='mx-auto mt-4 max-w-xl text-lg font-medium leading-8 text-ink-soft'>
            Upload a cOSmo employee KPI export first. Once a report is saved locally, this dashboard
            will organize the team performance by week.
          </p>
          <Link href='/' className='teg-button mt-8 text-sm'>
            Upload CSV
          </Link>
        </m.section>
      </main>
    </>
  );
}
