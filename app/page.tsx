'use client';

import Link from 'next/link';
import { ChangeEvent, DragEvent, useMemo, useRef, useState } from 'react';

type EmployeeKpiRow = {
  name: string;
  storeName: string;
  role: string;
  totalGames: number;
  guests: number;
  replaysSold: number;
  SUEs: number;
  reviewsAsked: number;
  sharedReplay: number;
  afterGamePreviews: number;
  replaysSoldPercent: number;
  suePercent: number;
  reviewsAskedPercent: number;
  sharedReplayPercent: number;
  previewsPercent: number;
  [key: string]: string | number;
};

type StoredWeek = {
  id: string;
  weekStart: string;
  weekLabel: string;
  fileName: string;
  uploadedAt: string;
  storeName: string;
  totals: {
    employees: number;
    totalGames: number;
    guests: number;
    replaysSold: number;
    reviewsAsked: number;
    sharedReplay: number;
    afterGamePreviews: number;
  };
  employees: EmployeeKpiRow[];
};

type KpiStorage = {
  version: 1;
  latestWeekId: string | null;
  weeks: StoredWeek[];
};

const STORAGE_KEY = 'employee-kpi-dashboard:v1';

const REQUIRED_COLUMNS = [
  'name',
  'storeName',
  'role',
  'totalGames',
  'guests',
  'replaysSold',
  'SUEs',
  'reviewsAsked',
  'sharedReplay',
  'afterGamePreviews',
  'replaysSoldPercent',
  'suePercent',
  'reviewsAskedPercent',
  'sharedReplayPercent',
  'previewsPercent',
];

const NUMBER_COLUMNS = new Set([
  'totalGames',
  'guests',
  'replaysSold',
  'SUEs',
  'reviewsAsked',
  'sharedReplay',
  'afterGamePreviews',
  'replaysSoldPercent',
  'suePercent',
  'reviewsAskedPercent',
  'sharedReplayPercent',
  'previewsPercent',
]);

function getMondayDateString(date = new Date()) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function formatWeekLabel(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const character = text[i];
    const nextCharacter = text[i + 1];

    if (character === '"' && nextCharacter === '"' && insideQuotes) {
      currentCell += '"';
      i += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !insideQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        i += 1;
      }

      currentRow.push(currentCell.trim());
      if (currentRow.some(Boolean)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += character;
  }

  if (currentCell || currentRow.length) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(Boolean)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) {
    throw new Error('This CSV does not include the team KPI rows we need.');
  }

  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, ''));
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));

  if (missingColumns.length) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  return rows.slice(1).map((row) => {
    return headers.reduce<Record<string, string | number>>((record, header, index) => {
      const rawValue = row[index] ?? '';
      record[header] = NUMBER_COLUMNS.has(header) ? Number(rawValue || 0) : rawValue;
      return record;
    }, {}) as EmployeeKpiRow;
  });
}

function getStorage(): KpiStorage {
  if (typeof window === 'undefined') {
    return { version: 1, latestWeekId: null, weeks: [] };
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return { version: 1, latestWeekId: null, weeks: [] };
  }

  try {
    return JSON.parse(stored) as KpiStorage;
  } catch {
    return { version: 1, latestWeekId: null, weeks: [] };
  }
}

function saveWeekToStorage(week: StoredWeek) {
  const currentStorage = getStorage();
  const weeksWithoutCurrent = currentStorage.weeks.filter(
    (storedWeek) => storedWeek.id !== week.id,
  );

  const nextStorage: KpiStorage = {
    version: 1,
    latestWeekId: week.id,
    weeks: [week, ...weeksWithoutCurrent].sort((a, b) => b.weekStart.localeCompare(a.weekStart)),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStorage));
  return nextStorage;
}

function buildStoredWeek(fileName: string, weekStart: string, rows: EmployeeKpiRow[]) {
  const storeName = rows[0]?.storeName || 'Unknown store';

  const totals = rows.reduce(
    (summary, row) => {
      summary.totalGames += Number(row.totalGames || 0);
      summary.guests += Number(row.guests || 0);
      summary.replaysSold += Number(row.replaysSold || 0);
      summary.reviewsAsked += Number(row.reviewsAsked || 0);
      summary.sharedReplay += Number(row.sharedReplay || 0);
      summary.afterGamePreviews += Number(row.afterGamePreviews || 0);
      return summary;
    },
    {
      employees: rows.length,
      totalGames: 0,
      guests: 0,
      replaysSold: 0,
      reviewsAsked: 0,
      sharedReplay: 0,
      afterGamePreviews: 0,
    },
  );

  return {
    id: `${weekStart}:${storeName.toLowerCase().replace(/\s+/g, '-')}`,
    weekStart,
    weekLabel: formatWeekLabel(weekStart),
    fileName,
    uploadedAt: new Date().toISOString(),
    storeName,
    totals,
    employees: rows,
  } satisfies StoredWeek;
}

export default function Home() {
  const [weekStart, setWeekStart] = useState(getMondayDateString());
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedWeek, setSavedWeek] = useState<StoredWeek | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const weekLabel = useMemo(() => formatWeekLabel(weekStart), [weekStart]);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setError(null);
    setSavedWeek(null);
    setSelectedFileName(file.name);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV export from cOSmo.');
      return;
    }

    try {
      setIsProcessing(true);
      const text = await file.text();
      const parsedRows = parseCsv(text);
      const week = buildStoredWeek(file.name, weekStart, parsedRows);
      saveWeekToStorage(week);
      setSavedWeek(week);
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : 'Something went wrong while preparing this report.',
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files[0]);
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0]);
    event.target.value = '';
  }

  return (
    <main className='min-h-screen bg-off-white px-5 py-6 text-cosmo-black sm:px-8 lg:px-14'>
      <section className='mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col justify-center'>
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

        <div className='grid items-center gap-8 lg:grid-cols-[1fr_0.9fr] xl:gap-12'>
          <div className='space-y-8'>
            <div className='font-tag inline-flex rounded-full bg-primary-web-red px-4 py-2 text-sm font-black uppercase text-cosmo-white shadow-[3px_4px_0_0_var(--primary-web-red-dark)]'>
              TEG KPI Clarity
            </div>

            <div className='space-y-5'>
              <h1 className='font-display max-w-4xl text-5xl font-black leading-[0.95] text-cosmo-black sm:text-6xl lg:text-7xl'>
                Use KPI data to lead with clarity.
              </h1>
              <p className='max-w-2xl text-lg font-medium leading-8 text-ink-soft sm:text-xl'>
                Upload the weekly Game Guide KPI CSV, confirm the report week, and create a local
                team performance view that supports guest experience, coaching, and FLNL clarity.
              </p>
            </div>

            <div className='grid gap-4 sm:grid-cols-3'>
              <div className='rounded-[28px] bg-cosmo-black p-5 text-cosmo-white shadow-[6px_7px_0_0_rgba(0,0,0,0.18)]'>
                <p className='font-display text-4xl font-black'>1</p>
                <p className='mt-3 text-sm font-semibold leading-6 text-cosmo-white/80'>
                  Upload the weekly cOSmo CSV.
                </p>
              </div>
              <div className='rounded-[28px] bg-blue p-5 text-cosmo-white shadow-[6px_7px_0_0_rgba(0,0,0,0.18)]'>
                <p className='font-display text-4xl font-black'>2</p>
                <p className='mt-3 text-sm font-semibold leading-6 text-cosmo-white/90'>
                  Confirm the reporting week.
                </p>
              </div>
              <div className='rounded-[28px] bg-purple p-5 text-cosmo-white shadow-[6px_7px_0_0_rgba(0,0,0,0.18)]'>
                <p className='font-display text-4xl font-black'>3</p>
                <p className='mt-3 text-sm font-semibold leading-6 text-cosmo-white/90'>
                  Create a clear team view.
                </p>
              </div>
            </div>

            <div className='rounded-[28px] border-2 border-cosmo-black/10 bg-cosmo-white p-5 shadow-[5px_6px_0_0_rgba(0,0,0,0.08)]'>
              <p className='font-heading text-xl font-black text-cosmo-black'>
                Built for Magic + Logic
              </p>
              <p className='mt-2 max-w-3xl text-sm font-medium leading-6 text-ink-soft'>
                Use the dashboard to celebrate strong guest-focused behaviors, coach clear next
                steps, and keep weekly communication concise, brand-focused, and actionable.
              </p>
            </div>
          </div>

          <div className='teg-panel p-3 text-cosmo-black md:p-4'>
            <div className='rounded-[24px] bg-comic-fog p-5 sm:p-8'>
              <div className='mb-6 flex items-start justify-between gap-4'>
                <div>
                  <h2 className='font-heading text-3xl font-black'>Upload weekly KPI report</h2>
                  <p className='mt-2 text-sm font-medium leading-6 text-ink-soft'>
                    CSV files stay on this device and are saved only in this browser.
                  </p>
                </div>
                <div className='font-tag rounded-full bg-cosmo-black px-4 py-2 text-xs font-black uppercase text-cosmo-white shadow-[3px_4px_0_0_rgba(0,0,0,0.2)]'>
                  CSV
                </div>
              </div>

              <label className='mb-5 block'>
                <span className='font-tag mb-2 block text-sm font-black text-cosmo-black'>
                  Report week
                </span>
                <input
                  type='date'
                  value={weekStart}
                  onChange={(event) => setWeekStart(event.target.value)}
                  className='teg-field h-12 w-full px-4 text-sm font-bold outline-none'
                />
                <span className='mt-2 block text-xs font-semibold text-ink-soft'>
                  Report will be saved as {weekLabel}
                </span>
              </label>

              <input
                ref={fileInputRef}
                type='file'
                accept='.csv,text/csv'
                className='hidden'
                onChange={handleFileInput}
              />

              <label
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-[28px] border-[3px] border-dashed p-8 text-center transition ${
                  isDragging
                    ? 'border-primary-web-red bg-cosmo-white'
                    : 'border-cosmo-black/25 bg-cosmo-white hover:border-primary-web-red'
                }`}>
                <div className='font-display mb-5 flex size-16 items-center justify-center rounded-[22px] bg-cosmo-black text-3xl font-black text-cosmo-white shadow-[4px_5px_0_0_rgba(0,0,0,0.18)]'>
                  ↑
                </div>
                <p className='font-heading text-xl font-black text-cosmo-black'>
                  Drop the weekly cOSmo export here
                </p>
                <p className='mt-2 max-w-sm text-sm font-medium leading-6 text-ink-soft'>
                  Or click to choose a CSV file. We’ll validate the columns, summarize the week, and
                  prepare the dashboard for manager review.
                </p>
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='teg-button mt-6 text-sm'>
                  Choose file
                </button>
              </label>

              <div className='mt-5 min-h-28 rounded-[24px] border-2 border-cosmo-black/10 bg-cosmo-white p-5'>
                {isProcessing ? (
                  <div>
                    <p className='font-heading font-black text-cosmo-black'>Preparing report...</p>
                    <p className='mt-1 text-sm font-medium text-ink-soft'>
                      Validating columns and creating the weekly team view.
                    </p>
                  </div>
                ) : error ? (
                  <div>
                    <p className='font-heading font-black text-kpi-red'>Upload failed</p>
                    <p className='mt-1 text-sm font-medium leading-6 text-ink-soft'>{error}</p>
                  </div>
                ) : savedWeek ? (
                  <div className='space-y-4'>
                    <div>
                      <p className='font-heading font-black text-kpi-green'>Weekly report saved</p>
                      <p className='mt-1 text-sm font-medium text-ink-soft'>
                        {savedWeek.fileName} is ready for {savedWeek.weekLabel}.
                      </p>
                    </div>
                    <div className='grid grid-cols-2 gap-3 text-sm sm:grid-cols-4'>
                      <div className='rounded-[18px] bg-comic-fog p-3'>
                        <p className='font-semibold text-ink-soft'>Team members</p>
                        <p className='text-lg font-black'>{savedWeek.totals.employees}</p>
                      </div>
                      <div className='rounded-[18px] bg-comic-fog p-3'>
                        <p className='font-semibold text-ink-soft'>Games</p>
                        <p className='text-lg font-black'>{savedWeek.totals.totalGames}</p>
                      </div>
                      <div className='rounded-[18px] bg-comic-fog p-3'>
                        <p className='font-semibold text-ink-soft'>Guests</p>
                        <p className='text-lg font-black'>{savedWeek.totals.guests}</p>
                      </div>
                      <div className='rounded-[18px] bg-comic-fog p-3'>
                        <p className='font-semibold text-ink-soft'>Replays</p>
                        <p className='text-lg font-black'>{savedWeek.totals.replaysSold}</p>
                      </div>
                    </div>
                    <Link href='/dashboard' className='teg-button text-sm'>
                      View dashboard
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className='font-heading font-black text-cosmo-black'>Ready for upload</p>
                    <p className='mt-1 text-sm font-medium leading-6 text-ink-soft'>
                      {selectedFileName
                        ? `${selectedFileName} selected.`
                        : 'No file selected yet. Upload the weekly cOSmo CSV to begin.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
