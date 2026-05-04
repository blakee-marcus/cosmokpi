'use client';

import type { ChangeEvent, DragEvent } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { HeroSection } from '@/components/homepage/HeroSection';
import { UploadPanel } from '@/components/homepage/UploadPanel';
import { waitForNextFrame } from '@/lib/homepage/browser';
import { formatWeekLabel, getMondayDateString } from '@/lib/homepage/dates';
import { buildStoredWeekFromCsvText, isCsvFile } from '@/lib/homepage/import-week';
import { saveWeekToStorage } from '@/lib/homepage/storage';
import type { StoredWeek } from '@/lib/homepage/types';

type UploadState = Readonly<{
  selectedFileName: string | null;
  reportTypeLabel: string | null;
  error: string | null;
  savedWeek: StoredWeek | null;
}>;

const INITIAL_UPLOAD_STATE: UploadState = {
  selectedFileName: null,
  reportTypeLabel: null,
  error: null,
  savedWeek: null,
};

const CSV_UPLOAD_ERROR = 'Please upload a CSV export from cOSmo.';
const UNKNOWN_UPLOAD_ERROR = 'Something went wrong while preparing this report.';

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
    async (file: File | undefined) => {
      if (!file || isProcessing) return;

      const selectedFileName = file.name;

      setUploadState({
        ...INITIAL_UPLOAD_STATE,
        selectedFileName,
      });

      if (!isCsvFile(file)) {
        setUploadState({
          ...INITIAL_UPLOAD_STATE,
          selectedFileName,
          error: CSV_UPLOAD_ERROR,
        });
        return;
      }

      try {
        setIsProcessing(true);
        await waitForNextFrame();

        const csvText = await file.text();
        const { week, reportTypeLabel } = await buildStoredWeekFromCsvText(
          csvText,
          selectedFileName,
          weekStart,
        );

        saveWeekToStorage(week);

        setUploadState({
          selectedFileName,
          reportTypeLabel,
          error: null,
          savedWeek: week,
        });
      } catch (currentError) {
        setUploadState({
          ...INITIAL_UPLOAD_STATE,
          selectedFileName,
          error: currentError instanceof Error ? currentError.message : UNKNOWN_UPLOAD_ERROR,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, weekStart],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDragging(false);
      void handleFile(event.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      void handleFile(event.target.files?.[0]);
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
              reportTypeLabel={uploadState.reportTypeLabel}
              savedWeek={uploadState.savedWeek}
              selectedFileName={uploadState.selectedFileName}
              weekLabel={weekLabel}
              weekStart={weekStart}
              onDragStateChange={setIsDragging}
              onDrop={handleDrop}
              onFileInputChange={handleFileInput}
              onWeekStartChange={handleWeekStartChange}
            />
          </div>
        </section>
      </main>
    </>
  );
}
