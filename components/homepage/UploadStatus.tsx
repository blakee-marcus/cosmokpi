import Link from 'next/link';

import type { StoredWeek } from '@/lib/homepage/types';

type UploadStatusProps = {
  error: string | null;
  isProcessing: boolean;
  reportTypeLabel: string | null;
  savedWeek: StoredWeek | null;
  selectedFileName: string | null;
};

type StatusTone = 'ready' | 'success' | 'waiting' | 'error';

const statusToneClasses: Record<StatusTone, string> = {
  ready: 'bg-primary-web-red text-cosmo-white',
  success: 'bg-kpi-green text-cosmo-white',
  waiting: 'bg-comic-fog text-ink-soft',
  error: 'bg-kpi-red text-cosmo-white',
};

function StatusBadge({ children, tone }: { children: string; tone: StatusTone }) {
  return (
    <span
      className={`font-tag inline-flex w-fit rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${statusToneClasses[tone]}`}>
      {children}
    </span>
  );
}

function StatusShell({ children, role }: { children: React.ReactNode; role?: 'alert' | 'status' }) {
  return (
    <div
      className='rounded-[24px] border-2 border-cosmo-black/10 bg-cosmo-white p-5'
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}>
      {children}
    </div>
  );
}

function StatusHeader({
  badge,
  description,
  title,
  tone,
}: {
  badge: string;
  description: string;
  title: string;
  tone: StatusTone;
}) {
  return (
    <div className='space-y-3'>
      <StatusBadge tone={tone}>{badge}</StatusBadge>

      <div>
        <p
          className={`font-heading text-xl font-black ${
            tone === 'error' ? 'text-kpi-red' : 'text-cosmo-black'
          }`}>
          {title}
        </p>
        <p className='mt-1 text-sm font-medium leading-6 text-ink-soft'>{description}</p>
      </div>
    </div>
  );
}

function SavedStat({ label, value }: { label: string; value: number }) {
  return (
    <div className='rounded-[18px] bg-comic-fog p-3'>
      <p className='text-xs font-black uppercase tracking-wide text-ink-soft'>{label}</p>
      <p className='mt-1 text-lg font-black text-cosmo-black'>{value}</p>
    </div>
  );
}

export function UploadStatus({
  error,
  isProcessing,
  reportTypeLabel,
  savedWeek,
  selectedFileName,
}: UploadStatusProps) {
  if (isProcessing) {
    return (
      <StatusShell role='status'>
        <StatusHeader
          badge='Checking file'
          tone='waiting'
          title='Preparing report...'
          description='We’re validating the CSV and building the weekly team view. Nothing has been saved yet.'
        />
      </StatusShell>
    );
  }

  if (error) {
    return (
      <StatusShell role='alert'>
        <StatusHeader
          badge='Needs attention'
          tone='error'
          title='Upload failed'
          description={error}
        />
      </StatusShell>
    );
  }

  if (savedWeek) {
    const stats = [
      { label: 'Team', value: savedWeek.totals.employees },
      { label: 'Games', value: savedWeek.totals.totalGames },
      { label: 'Guests', value: savedWeek.totals.guests },
      { label: 'Replays', value: savedWeek.totals.replaysSold },
    ];

    return (
      <StatusShell role='status'>
        <div className='space-y-5'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='space-y-3'>
              <StatusBadge tone='ready'>Ready to save</StatusBadge>

              <div>
                <p className='font-heading text-xl font-black text-cosmo-black'>Report is ready</p>
                <p className='mt-1 text-sm font-medium leading-6 text-ink-soft'>
                  {savedWeek.fileName} is prepared for {savedWeek.weekLabel}. Save it to open the
                  dashboard and review team performance.
                </p>
              </div>

              {reportTypeLabel ? (
                <p className='text-xs font-black uppercase tracking-wide text-ink-soft'>
                  Report type: {reportTypeLabel}
                </p>
              ) : null}
            </div>

            <div className='w-fit rounded-[16px] bg-comic-fog px-4 py-3 text-xs font-black uppercase tracking-wide text-ink-soft'>
              Browser save pending
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {stats.map((stat) => (
              <SavedStat key={stat.label} {...stat} />
            ))}
          </div>

          <div className='rounded-[20px] bg-primary-web-red p-4 text-cosmo-white'>
            <p className='font-heading text-base font-black'>Final step</p>
            <p className='mt-1 text-sm font-semibold leading-6 text-cosmo-white/85'>
              Save this weekly report, then open the dashboard.
            </p>

            <Link
              href='/dashboard'
              className='mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-cosmo-white px-5 text-sm font-black text-primary-web-red transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cosmo-white/40 sm:w-fit'>
              Save and open dashboard
            </Link>
          </div>
        </div>
      </StatusShell>
    );
  }

  return (
    <StatusShell role='status'>
      <StatusHeader
        badge={selectedFileName ? 'File selected' : 'Waiting for CSV'}
        tone='waiting'
        title={selectedFileName ? 'Ready to process' : 'Ready for upload'}
        description={
          selectedFileName
            ? `${selectedFileName} is selected. Once processing finishes, you’ll be able to save and open the dashboard.`
            : 'Upload the weekly cOSmo CSV to begin. Nothing is saved until the dashboard opens.'
        }
      />
    </StatusShell>
  );
}
