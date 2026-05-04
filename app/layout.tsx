import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { AppHeader } from '@/components/ui/AppHeader';
import './globals.css';

const APP_NAME = 'TEG KPI Clarity';

const APP_DESCRIPTION =
  'Import cOSmo KPI exports, review weekly team performance, and turn KPI data into clear leadership follow-through.';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    'TEG KPI dashboard',
    'cOSmo KPI',
    'weekly KPI exports',
    'team member coaching',
    'guest experience metrics',
    'leadership follow-through',
  ],
  authors: [{ name: 'Blake Marcus' }],
  creator: 'Blake Marcus',
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f5f6fa',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en' className='h-full scroll-smooth bg-off-white antialiased'>
      <body className='min-h-dvh overflow-x-hidden bg-off-white font-sans text-cosmo-black'>
        <a
          href='#main-content'
          className='sr-only absolute left-4 top-4 z-50 rounded-full border-2 border-cosmo-black bg-primary-web-red px-4 py-2 font-tag text-sm font-black uppercase tracking-wide text-cosmo-white shadow-[4px_4px_0_0_var(--cosmo-black)] transition focus:not-sr-only focus:outline-none focus:ring-4 focus:ring-primary-web-red/30'>
          Skip to main content
        </a>

        <div className='relative flex min-h-dvh flex-col'>
          <AppHeader />

          <div id='main-content' className='flex-1'>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
