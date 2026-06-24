import Link from 'next/link';
import * as m from 'motion/react-m';

import { panelIn } from '@/lib/motion';

export function EmptyDashboardState() {
  return (
    <main className='flex min-h-[calc(100dvh-82px)] items-center justify-center bg-off-white px-5 py-10 text-cosmo-black'>
      <m.section
        variants={panelIn}
        initial={false}
        animate='visible'
        className='bg-cosmo-white p-6 text-center shadow-teg-button-red border-b border-cosmo-black/10 rounded-[22px] max-w-2xl w-full overflow-hidden'>
        <div
          aria-hidden='true'
          className='mx-auto mb-6 flex items-center justify-center size-16 rounded-[22px] bg-primary-web-red text-base font-black tracking-tight text-cosmo-white shadow-teg-button-red'>
          KPI
        </div>
        <p className='text-xs font-black uppercase tracking-[0.28em] text-primary-web-red'>
          Magic + Logic starts here
        </p>

        <h1 className='font-heading mt-3 text-4xl font-black leading-tight'>
          Upload your first KPI report
        </h1>
        <p className='mt-4 max-w-xl mx-auto text-lg font-medium leading-8 text-ink-soft'>
          Save a cOSmo employee KPI export locally to turn team performance into clear wins,
          coaching focus, and data-driven next steps for the selected week.
        </p>

        <Link
          href='/'
          className='teg-button mt-8 text-sm'
          aria-label='Upload a cOSmo employee KPI CSV'>
          Upload CSV
        </Link>

        <div className='mt-6 grid gap-4 bg-off-white px-8 py-6 text-left sm:grid-cols-3'>
          <div>
            <p className='text-sm font-black text-cosmo-black'>Review</p>
            <p className='mt-1 text-sm font-medium leading-6 text-ink-soft'>
              Confirm the file and report week before anything is saved.
            </p>
          </div>

          <div>
            <p className='text-sm font-black text-cosmo-black'>Save locally</p>
            <p className='mt-1 text-sm font-medium leading-6 text-ink-soft'>
              Keep KPI data in the browser for a simple, private workflow.
            </p>
          </div>

          <div>
            <p className='text-sm font-black text-cosmo-black'>Lead clearly</p>
            <p className='mt-1 text-sm font-medium leading-6 text-ink-soft'>
              Use weekly performance to celebrate, coach, and follow through.
            </p>
          </div>
        </div>
      </m.section>
    </main>
  );
}
