import type { ChangeEvent, DragEvent, RefObject } from 'react';
import * as m from 'motion/react-m';

import type { StoredWeek } from '@/lib/homepage/types';
import { panelIn } from '@/lib/motion';
import { FileDropzone } from './FileDropzone';
import { UploadStatus } from './UploadStatus';
import { WeekPicker } from './WeekPicker';

type UploadPanelProps = {
  error: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isDragging: boolean;
  isProcessing: boolean;
  reportTypeLabel: string | null;
  savedWeek: StoredWeek | null;
  selectedFileName: string | null;
  weekLabel: string;
  weekStart: string;
  onDragStateChange: (isDragging: boolean) => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onWeekStartChange: (weekStart: string) => void;
};

export function UploadPanel({
  error,
  fileInputRef,
  isDragging,
  isProcessing,
  reportTypeLabel,
  savedWeek,
  selectedFileName,
  weekLabel,
  weekStart,
  onDragStateChange,
  onDrop,
  onFileInputChange,
  onWeekStartChange,
}: UploadPanelProps) {
  return (
    <m.div
      variants={panelIn}
      initial={false}
      animate='visible'
      className='teg-panel p-3 text-cosmo-black md:p-4'>
      <div className='rounded-[24px] bg-comic-fog p-5 sm:p-8'>
        <div className='mb-6 flex items-start justify-between gap-4'>
          <div>
            <h2 className='font-heading text-3xl font-black'>Upload weekly KPI report</h2>
            <p className='mt-2 text-sm font-medium leading-6 text-ink-soft'>
              CSV files stay on this device and are saved only in this browser.
            </p>
          </div>
          <div className='teg-eyebrow bg-cosmo-black text-cosmo-white shadow-[3px_4px_0_0_rgba(0,0,0,0.2)]'>
            CSV
          </div>
        </div>

        <WeekPicker
          weekLabel={weekLabel}
          weekStart={weekStart}
          onWeekStartChange={onWeekStartChange}
        />

        <FileDropzone
          fileInputRef={fileInputRef}
          isDragging={isDragging}
          onDragStateChange={onDragStateChange}
          onDrop={onDrop}
          onFileInputChange={onFileInputChange}
        />

        <div className='mt-5 min-h-28 rounded-[24px] border-2 border-cosmo-black/10 bg-cosmo-white p-5'>
          <UploadStatus
            error={error}
            isProcessing={isProcessing}
            reportTypeLabel={reportTypeLabel}
            savedWeek={savedWeek}
            selectedFileName={selectedFileName}
          />
        </div>
      </div>
    </m.div>
  );
}
