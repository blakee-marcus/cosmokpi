'use client';

import type { ChangeEvent, DragEvent } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { HeroSection } from '@/components/homepage/HeroSection';
import { UploadPanel } from '@/components/homepage/UploadPanel';
import { trackImpactEvent, trackUploadFailure } from '@/lib/analytics';
import type { CsvValidationError } from '@/lib/csv-parser';
import { waitForNextFrame } from '@/lib/homepage/browser';
import { formatWeekLabel, getMondayDateString } from '@/lib/homepage/dates';
import {
  buildStoredWeekFromCsvText,
  CsvImportError,
  getFileTypeValidationError,
  isCsvFile,
  type ImportWarning,
} from '@/lib/homepage/import-week';
import { findStoredWeekForImport, saveWeekToStorage } from '@/lib/homepage/storage';
import type { StoredWeek } from '@/lib/homepage/types';

type UploadSource = 'file_picker' | 'drag_drop';

type PendingImport = Readonly<{
  selectedFileName: string;
  reportTypeLabel: string;
  source: UploadSource;
  week: StoredWeek;
  existingWeek: StoredWeek | null;
  warnings: ImportWarning[];
}>;

type UploadState = Readonly<{
  selectedFileName: string | null;
  reportTypeLabel: string | null;
  error: CsvValidationError | null;
  pendingImport: PendingImport | null;
  savedWeek: StoredWeek | null;
}>;

const INITIAL_UPLOAD_STATE: UploadState = {
  selectedFileName: null,
  reportTypeLabel: null,
  error: null,
  pendingImport: null,
  savedWeek: null,
};

function getValidationError(error: unknown): CsvValidationError {
  if (error instanceof CsvImportError) {
    return error.validationError;
  }

  return {
    code: 'unknown',
    title: 'Import failed',
    message: 'Something went wrong while preparing this report.',
    nextStep: 'Check the CSV export and try uploading it again.',
  };
}

export default function Home() {
  const [weekStart, setWeekStart] = useState(() => getMondayDateString());
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>(INITIAL_UPLOAD_STATE);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const weekLabel = useMemo(() => formatWeekLabel(weekStart), [weekStart]);

  const handleWeekStartChange = useCallback((nextWeekStart: string) => {
    setWeekStart(nextWeekStart);
    setUploadState(INITIAL_UPLOAD_STATE);
  }, []);

  const handleFile = useCallback(
    async (file: File | undefined, source: UploadSource) => {
      if (!file || isProcessing) return;

      const selectedFileName = file.name;

      trackImpactEvent('KPI Report Upload Started', { source });

      setUploadState({
        ...INITIAL_UPLOAD_STATE,
        selectedFileName,
      });

      if (!isCsvFile(file)) {
        trackImpactEvent('KPI Report Upload Rejected', {
          reason: 'not_csv',
          source,
        });
        setUploadState({
          ...INITIAL_UPLOAD_STATE,
          selectedFileName,
          error: getFileTypeValidationError(),
        });
        return;
      }

      try {
        setIsProcessing(true);
        await waitForNextFrame();

        const csvText = await file.text();
        const { week, reportTypeLabel, warnings } = await buildStoredWeekFromCsvText(
          csvText,
          selectedFileName,
          weekStart,
        );
        const existingWeek = findStoredWeekForImport(week);

        trackImpactEvent('KPI Report Validated', {
          report_type: reportTypeLabel,
          source,
        });

        setUploadState({
          selectedFileName,
          reportTypeLabel,
          error: null,
          pendingImport: {
            selectedFileName,
            reportTypeLabel,
            source,
            week,
            existingWeek,
            warnings,
          },
          savedWeek: null,
        });
      } catch (currentError) {
        const validationError = getValidationError(currentError);

        trackUploadFailure(validationError.title, source);

        setUploadState({
          ...INITIAL_UPLOAD_STATE,
          selectedFileName,
          error: validationError,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, weekStart],
  );

  const handleConfirmImport = useCallback(() => {
    const pendingImport = uploadState.pendingImport;

    if (!pendingImport) return;

    const savedStorage = saveWeekToStorage(pendingImport.week);
    const savedWeek =
      savedStorage.weeks.find((week) => week.id === pendingImport.week.id) ?? pendingImport.week;

    trackImpactEvent('KPI Report Saved', {
      report_type: pendingImport.reportTypeLabel,
      source: pendingImport.source,
      import_mode: pendingImport.existingWeek ? 'replace' : 'new',
    });

    setUploadState({
      selectedFileName: pendingImport.selectedFileName,
      reportTypeLabel: pendingImport.reportTypeLabel,
      error: null,
      pendingImport: null,
      savedWeek,
    });
  }, [uploadState.pendingImport]);

  const handleCancelImport = useCallback(() => {
    const pendingImport = uploadState.pendingImport;

    trackImpactEvent('KPI Report Import Canceled', {
      stage: pendingImport?.existingWeek ? 'duplicate_preview' : 'preview',
    });

    setUploadState({
      ...INITIAL_UPLOAD_STATE,
      selectedFileName: pendingImport?.selectedFileName ?? uploadState.selectedFileName,
    });
  }, [uploadState.pendingImport, uploadState.selectedFileName]);

  const handleUploadAnotherWeek = useCallback(() => {
    setUploadState(INITIAL_UPLOAD_STATE);
    fileInputRef.current?.focus();
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDragging(false);
      void handleFile(event.dataTransfer.files[0], 'drag_drop');
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      void handleFile(event.target.files?.[0], 'file_picker');
      event.target.value = '';
    },
    [handleFile],
  );

  return (
    <>
      <main
        id='main-content'
        className='relative min-h-[calc(100dvh-82px)] overflow-hidden bg-off-white px-5 py-8 text-cosmo-black sm:px-8 lg:px-14'>
        <section
          aria-label='Upload weekly KPI report'
          className='mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-7xl flex-col justify-center'>
          <div className='grid items-center gap-8 lg:grid-cols-[1fr_0.9fr] xl:gap-12'>
            <HeroSection />

            <UploadPanel
              error={uploadState.error}
              fileInputRef={fileInputRef}
              isDragging={isDragging}
              isProcessing={isProcessing}
              pendingImport={uploadState.pendingImport}
              reportTypeLabel={uploadState.reportTypeLabel}
              savedWeek={uploadState.savedWeek}
              selectedFileName={uploadState.selectedFileName}
              weekLabel={weekLabel}
              weekStart={weekStart}
              onDragStateChange={setIsDragging}
              onDrop={handleDrop}
              onFileInputChange={handleFileInput}
              onCancelImport={handleCancelImport}
              onConfirmImport={handleConfirmImport}
              onUploadAnotherWeek={handleUploadAnotherWeek}
              onWeekStartChange={handleWeekStartChange}
            />
          </div>
        </section>
      </main>
    </>
  );
}
