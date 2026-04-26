import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const APP_NAME = 'TEG KPI Clarity';
const APP_DESCRIPTION =
  'Upload cOSmo KPI exports, organize weekly team member results, and turn data into clear leadership follow-through.';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    'The Escape Game',
    'TEG',
    'cOSmo',
    'KPI',
    'team member coaching',
    'guest experience',
    'leadership clarity',
  ],
  authors: [{ name: 'The Escape Game' }],
  creator: 'The Escape Game',
  publisher: 'The Escape Game',
  metadataBase: new URL('https://theescapegame.com'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f5f6fa',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en' className='h-full bg-off-white antialiased'>
      <body className='min-h-dvh overflow-x-hidden bg-off-white font-sans text-cosmo-black'>
        <a href="#main-content" className="sr-only focus:not-sr-only absolute left-4 top-4 z-50 rounded-md bg-primary-web-red px-4 py-2 text-sm font-bold text-cosmo-white focus:outline-none focus:ring-4 focus:ring-primary-web-red/30">Skip to main content</a>
        <div className='flex min-h-dvh flex-col'>{children}</div>
      </body>
    </html>
  );
}
