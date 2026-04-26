'use client';

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from 'react';
import { HeroSection } from '@/components/homepage/HeroSection';
import { HomeHeader } from '@/components/homepage/HomeHeader';
import { UploadPanel } from '@/components/homepage/UploadPanel';
import { waitForNextFrame } from '@/lib/homepage/browser';
import { formatWeekLabel, getMondayDateString } from '@/lib/homepage/dates';
import { buildStoredWeekFromCsvText, isCsvFile } from '@/lib/homepage/import-week';
import { saveWeekToStorage } from '@/lib/homepage/storage';
import type { StoredWeek } from '@/lib/homepage/types';

export default function Home() {
  const [weekStart, setWeekStart] = useState(getMondayDateString());
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [reportTypeLabel, setReportTypeLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedWeek, setSavedWeek] = useState<StoredWeek | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const weekLabel = useMemo(() => formatWeekLabel(weekStart), [weekStart]);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setError(null);
    setSavedWeek(null);
    setReportTypeLabel(null);
    setSelectedFileName(file.name);

    if (!isCsvFile(file)) {
      setError('Please upload a CSV export from cOSmo.');
      return;
    }

    try {
      setIsProcessing(true);
      await waitForNextFrame();

      const text = await file.text();
      const result = await buildStoredWeekFromCsvText(text, file.name, weekStart);

      saveWeekToStorage(result.week);
      setReportTypeLabel(result.reportTypeLabel);
      setSavedWeek(result.week);
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
    <main
      id='main-content'
      className='min-h-screen bg-off-white px-5 py-6 text-cosmo-black sm:px-8 lg:px-14'>
      <section className='mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col justify-center'>
        <HomeHeader />

        <div className='grid items-center gap-8 lg:grid-cols-[1fr_0.9fr] xl:gap-12'>
          <HeroSection />
          <UploadPanel
            error={error}
            fileInputRef={fileInputRef}
            isDragging={isDragging}
            isProcessing={isProcessing}
            reportTypeLabel={reportTypeLabel}
            savedWeek={savedWeek}
            selectedFileName={selectedFileName}
            weekLabel={weekLabel}
            weekStart={weekStart}
            onDragStateChange={setIsDragging}
            onDrop={handleDrop}
            onFileInputChange={handleFileInput}
            onWeekStartChange={setWeekStart}
          />
        </div>
      </section>
    </main>
  );
}
