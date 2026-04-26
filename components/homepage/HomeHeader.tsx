import Link from 'next/link';

export function HomeHeader() {
  return (
    <div className='mb-8 flex items-center justify-between gap-4'>
      <Link
        href='/'
        className='font-heading text-xl font-black text-cosmo-black focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-web-red/30'>
        cOSmo KPI
      </Link>
      <Link href='/dashboard' className='teg-button-secondary text-sm'>
        Dashboard
      </Link>
    </div>
  );
}
