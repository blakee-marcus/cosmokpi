'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = Readonly<{
  href: string;
  label: string;
  eyebrow?: string;
  isActive: (pathname: string) => boolean;
}>;

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Import',
    eyebrow: 'Add data',
    isActive: (pathname) => pathname === '/',
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    eyebrow: 'Review KPIs',
    isActive: (pathname) => pathname.startsWith('/dashboard'),
  },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className='sticky top-0 z-40 border-b-2 border-cosmo-black/10 bg-cosmo-white/95 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur'>
      <nav
        aria-label='Internal tools'
        className='mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-3 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-14'>
        <Link
          href='/'
          aria-label='TEG KPI Clarity home'
          className='group flex w-fit items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-web-red/30'>
          <span className='grid size-12 shrink-0 place-items-center rounded-[18px] border-2 border-cosmo-black bg-primary-web-red font-heading text-xl font-black text-cosmo-white shadow-teg-button-red transition group-hover:-translate-y-0.5 group-hover:bg-berry'>
            T
          </span>

          <span className='min-w-0'>
            <span className='block font-heading text-xl font-black leading-none tracking-tight text-cosmo-black sm:text-2xl'>
              TEG KPI Clarity
            </span>
            <span className='mt-1 block text-xs font-black uppercase tracking-wide text-primary-web-red'>
              Internal leadership tools
            </span>
          </span>
        </Link>

        <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
          <div className='flex gap-2 overflow-x-auto p-1.5'>
            {navItems.map((navItem) => {
              const isActive = navItem.isActive(pathname);

              return (
                <Link
                  key={navItem.href}
                  href={navItem.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex h-11 flex-col items-start justify-center gap-0.5 rounded-3xl px-4 font-dmsans outline outline-[3px] outline-offset-[-3px] transition-all duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-primary-web-red text-cosmo-white shadow-[3px_4px_0px_0px_var(--cosmo-black)] outline-primary-web-red-dark/80'
                      : 'bg-cosmo-white text-cosmo-black shadow-[3px_4px_0px_0px_rgba(0,0,0,0.12)] outline-cosmo-black/10 hover:bg-cosmo-white/80 active:translate-x-[3px] active:translate-y-[4px] active:shadow-none'
                  }`}>
                  {navItem.eyebrow ? (
                    <span
                      className={`hidden text-[9px] font-semibold uppercase tracking-widest sm:block ${
                        isActive ? 'text-cosmo-white/50' : 'text-ink-soft'
                      }`}>
                      {navItem.eyebrow}
                    </span>
                  ) : null}
                  <span className='text-sm font-bold leading-none tracking-tight'>
                    {navItem.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
