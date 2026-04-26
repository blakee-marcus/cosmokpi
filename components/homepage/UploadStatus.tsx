import Link from 'next/link';
import type { StoredWeek } from '@/lib/homepage/types';

type UploadStatusProps = {
  error: string | null;
  isProcessing: boolean;
  reportTypeLabel: string | null;
  savedWeek: StoredWeek | null;
  selectedFileName: string | null;
};

function SavedStat({ label, value }: { label: string; value: number }) {
  return (
    <div className='rounded-[18px] bg-comic-fog p-3'>
      <p className='font-semibold text-ink-soft'>{label}</p>
      <p className='text-lg font-black'>{value}</p>
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
      <div>
        <p className='font-heading font-black text-cosmo-black'>Preparing report...</p>
        <p className='mt-1 text-sm font-medium text-ink-soft'>
          Validating columns and creating the weekly team view.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div role='alert'>
        <p className='font-heading font-black text-kpi-red'>Upload failed</p>
        <p className='mt-1 text-sm font-medium leading-6 text-ink-soft'>{error}</p>
      </div>
    );
  }

  if (savedWeek) {
    const stats = [
      { label: 'Team members', value: savedWeek.totals.employees },
      { label: 'Games', value: savedWeek.totals.totalGames },
      { label: 'Guests', value: savedWeek.totals.guests },
      { label: 'Replays', value: savedWeek.totals.replaysSold },
    ];

    return (
      <div className='space-y-4'>
        <div>
          <p className='font-heading font-black text-kpi-green'>Weekly report saved</p>
          <p className='mt-1 text-sm font-medium text-ink-soft'>
            {savedWeek.fileName} is ready for {savedWeek.weekLabel}.
          </p>
          {reportTypeLabel ? (
            <p className='mt-1 text-xs font-black uppercase tracking-wide text-ink-soft'>
              Report type: {reportTypeLabel}
            </p>
          ) : null}
        </div>
        <div className='grid grid-cols-2 gap-3 text-sm sm:grid-cols-4'>
          {stats.map((stat) => (
            <SavedStat key={stat.label} {...stat} />
          ))}
        </div>
        <Link href='/dashboard' className='teg-button text-sm'>
          View dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className='font-heading font-black text-cosmo-black'>Ready for upload</p>
      <p className='mt-1 text-sm font-medium leading-6 text-ink-soft'>
        {selectedFileName
          ? `${selectedFileName} selected.`
          : 'No file selected yet. Upload the weekly cOSmo CSV to begin.'}
      </p>
    </div>
  );
}
