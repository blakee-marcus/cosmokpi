import type { ChangeEvent, DragEvent, RefObject } from 'react';
import { CSV_UPLOAD_ACCEPT } from '@/lib/homepage/constants';

type FileDropzoneProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isDragging: boolean;
  onDragStateChange: (isDragging: boolean) => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function FileDropzone({
  fileInputRef,
  isDragging,
  onDragStateChange,
  onDrop,
  onFileInputChange,
}: FileDropzoneProps) {
  return (
    <>
      <input
        id='csv-upload'
        ref={fileInputRef}
        type='file'
        accept={CSV_UPLOAD_ACCEPT}
        className='hidden'
        onChange={onFileInputChange}
      />

      <label
        htmlFor='csv-upload'
        aria-label='Upload cOSmo CSV file'
        onDragOver={(event) => {
          event.preventDefault();
          onDragStateChange(true);
        }}
        onDragLeave={() => onDragStateChange(false)}
        onDrop={onDrop}
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
    </>
  );
}
