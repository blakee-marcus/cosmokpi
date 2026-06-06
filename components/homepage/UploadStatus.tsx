import type { ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';

import type { CsvValidationError } from '@/lib/csv-parser';
import type { ImportWarning } from '@/lib/homepage/import-week';
import type { StoredWeek } from '@/lib/homepage/types';
import { fadeUp, listContainer, listItem } from '@/lib/motion';

type UploadStatusProps = {
  error: CsvValidationError | null;
  isProcessing: boolean;
  pendingImport: {
    selectedFileName: string;
    reportTypeLabel: string;
    week: StoredWeek;
    existingWeek: StoredWeek | null;
    warnings: ImportWarning[];
  } | null;
  reportTypeLabel: string | null;
  savedWeek: StoredWeek | null;
  selectedFileName: string | null;
  onCancelImport: () => void;
  onConfirmImport: () => void;
  onUploadAnotherWeek: () => void;
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

function StatusShell({ children, role }: { children: ReactNode; role?: 'alert' | 'status' }) {
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
  pendingImport,
  reportTypeLabel,
  savedWeek,
  selectedFileName,
  onCancelImport,
  onConfirmImport,
  onUploadAnotherWeek,
}: UploadStatusProps) {
  const statusKey = isProcessing
    ? 'processing'
    : error
      ? `error-${error.code}`
      : pendingImport
        ? `preview-${pendingImport.week.id}`
        : savedWeek
          ? `saved-${savedWeek.id}`
          : selectedFileName
            ? `selected-${selectedFileName}`
            : 'waiting';

  let content: ReactNode;

  if (isProcessing) {
    content = (
      <StatusShell role='status'>
        <StatusHeader
          badge='Checking file'
          tone='waiting'
          title='Preparing report...'
          description='We’re validating the CSV and building the weekly team view. The report will save locally after the file passes validation.'
        />
      </StatusShell>
    );
  } else if (error) {
    content = (
      <StatusShell role='alert'>
        <StatusHeader
          badge='Needs attention'
          tone='error'
          title={error.title}
          description={error.message}
        />

        <p className='mt-4 rounded-[16px] bg-kpi-red/10 p-3 text-sm font-semibold leading-6 text-kpi-red'>
          {error.nextStep}
        </p>
      </StatusShell>
    );
  } else if (pendingImport) {
    const isReplacement = Boolean(pendingImport.existingWeek);
    const stats = [
      { label: 'Team', value: pendingImport.week.totals.employees },
      { label: 'Rows', value: pendingImport.week.sourceFiles?.[0]?.rowCount ?? 0 },
      { label: 'Games', value: pendingImport.week.totals.totalGames },
      { label: 'Guests', value: pendingImport.week.totals.guests },
    ];

    content = (
      <StatusShell role='status'>
        <div className='space-y-5'>
          <StatusHeader
            badge={isReplacement ? 'Replace report?' : 'Ready to save'}
            tone='ready'
            title={isReplacement ? 'Confirm local replacement' : 'Review import before saving'}
            description={
              isReplacement
                ? 'A local report already exists for this store and week. Confirm before replacing it in this browser.'
                : 'Validation passed. Confirm the report details before saving it locally in this browser.'
            }
          />

          <div className='grid gap-3 text-sm font-semibold text-ink-soft sm:grid-cols-2'>
            <div className='rounded-[18px] bg-comic-fog p-3'>
              <p className='text-xs font-black uppercase tracking-wide'>File</p>
              <p className='mt-1 break-words text-cosmo-black'>{pendingImport.selectedFileName}</p>
            </div>
            <div className='rounded-[18px] bg-comic-fog p-3'>
              <p className='text-xs font-black uppercase tracking-wide'>Saved week</p>
              <p className='mt-1 text-cosmo-black'>{pendingImport.week.weekLabel}</p>
            </div>
            <div className='rounded-[18px] bg-comic-fog p-3'>
              <p className='text-xs font-black uppercase tracking-wide'>Store</p>
              <p className='mt-1 text-cosmo-black'>{pendingImport.week.storeName}</p>
            </div>
            <div className='rounded-[18px] bg-comic-fog p-3'>
              <p className='text-xs font-black uppercase tracking-wide'>Report type</p>
              <p className='mt-1 text-cosmo-black'>{pendingImport.reportTypeLabel}</p>
            </div>
          </div>

          <m.div variants={listContainer} className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {stats.map((stat) => (
              <m.div key={stat.label} variants={listItem}>
                <SavedStat {...stat} />
              </m.div>
            ))}
          </m.div>

          {pendingImport.existingWeek ? (
            <div className='rounded-[18px] border-2 border-primary-web-red/20 bg-primary-web-red/5 p-4'>
              <p className='font-heading text-base font-black text-cosmo-black'>
                Existing local report
              </p>
              <p className='mt-2 text-sm font-semibold leading-6 text-ink-soft'>
                {pendingImport.existingWeek.fileName} was imported{' '}
                {new Date(pendingImport.existingWeek.importedAt).toLocaleString()} with{' '}
                {pendingImport.existingWeek.sourceFiles?.[0]?.rowCount ?? 0} rows. Replacing updates
                only this local report.
              </p>
            </div>
          ) : null}

          {pendingImport.warnings.map((warning) => (
            <div key={warning.code} className='rounded-[18px] bg-kpi-yellow/20 p-4'>
              <p className='font-heading text-base font-black text-cosmo-black'>{warning.title}</p>
              <p className='mt-1 text-sm font-semibold leading-6 text-ink-soft'>{warning.message}</p>
              <p className='mt-2 text-sm font-black text-cosmo-black'>{warning.nextStep}</p>
            </div>
          ))}

          <div className='flex flex-col gap-3 sm:flex-row'>
            <button
              type='button'
              onClick={onConfirmImport}
              className='min-h-11 rounded-full bg-primary-web-red px-5 text-sm font-black text-cosmo-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-web-red/25'>
              {isReplacement ? 'Replace local report' : 'Save local report'}
            </button>
            <button
              type='button'
              onClick={onCancelImport}
              className='min-h-11 rounded-full border-2 border-cosmo-black/15 px-5 text-sm font-black text-cosmo-black transition-colors hover:bg-comic-fog focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cosmo-black/10'>
              Cancel
            </button>
          </div>
        </div>
      </StatusShell>
    );
  } else if (savedWeek) {
    const stats = [
      { label: 'Team', value: savedWeek.totals.employees },
      { label: 'Games', value: savedWeek.totals.totalGames },
      { label: 'Guests', value: savedWeek.totals.guests },
      { label: 'Replays', value: savedWeek.totals.replaysSold },
    ];

    content = (
      <StatusShell role='status'>
        <div className='space-y-5'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='space-y-3'>
              <StatusBadge tone='success'>Report saved</StatusBadge>

              <div>
                <p className='font-heading text-xl font-black text-cosmo-black'>
                  Report saved successfully
                </p>
                <p className='mt-1 text-sm font-medium leading-6 text-ink-soft'>
                  {savedWeek.fileName} is saved locally for {savedWeek.weekLabel}. Open the
                  dashboard to review the team performance snapshot.
                </p>
              </div>

              {reportTypeLabel ? (
                <p className='text-xs font-black uppercase tracking-wide text-ink-soft'>
                  Report type: {reportTypeLabel}
                </p>
              ) : null}
            </div>

            <div className='w-fit rounded-[16px] bg-comic-fog px-4 py-3 text-xs font-black uppercase tracking-wide text-ink-soft'>
              Saved in this browser
            </div>
          </div>

          <m.div variants={listContainer} className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {stats.map((stat) => (
              <m.div key={stat.label} variants={listItem}>
                <SavedStat {...stat} />
              </m.div>
            ))}
          </m.div>

          <div className='rounded-[20px] bg-primary-web-red p-4 text-cosmo-white'>
            <p className='font-heading text-base font-black'>Ready for review</p>
            <p className='mt-1 text-sm font-semibold leading-6 text-cosmo-white/85'>
              Open the dashboard to compare the week, review category signals, and export for FLNL.
            </p>

            <Link
              href='/dashboard'
              className='mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-cosmo-white px-5 text-sm font-black text-primary-web-red transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cosmo-white/40 sm:w-fit'>
              Open dashboard
            </Link>
            <button
              type='button'
              onClick={onUploadAnotherWeek}
              className='mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border-2 border-cosmo-white/45 px-5 text-sm font-black text-cosmo-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cosmo-white/40 sm:ml-3 sm:mt-4 sm:w-fit'>
              Upload another week
            </button>
          </div>
        </div>
      </StatusShell>
    );
  } else {
    content = (
      <StatusShell role='status'>
        <StatusHeader
          badge={selectedFileName ? 'File selected' : 'Waiting for CSV'}
          tone='waiting'
          title={selectedFileName ? 'Ready to process' : 'Ready for upload'}
          description={
            selectedFileName
              ? `${selectedFileName} is selected. Once processing finishes, the report will save locally and the dashboard will be ready.`
              : 'Upload the weekly cOSmo CSV to begin. Reports are saved locally only after validation passes.'
          }
        />
      </StatusShell>
    );
  }

  return (
    <AnimatePresence initial={false} mode='wait'>
      <m.div
        key={statusKey}
        variants={fadeUp}
        initial={false}
        animate='visible'
        exit='hidden'>
        {content}
      </m.div>
    </AnimatePresence>
  );
}
