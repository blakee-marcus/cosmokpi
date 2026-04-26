type WeekPickerProps = {
  weekLabel: string;
  weekStart: string;
  onWeekStartChange: (weekStart: string) => void;
};

export function WeekPicker({ weekLabel, weekStart, onWeekStartChange }: WeekPickerProps) {
  return (
    <label className='mb-5 block'>
      <span className='font-tag mb-2 block text-sm font-black text-cosmo-black'>Report week</span>
      <input
        type='date'
        value={weekStart}
        onChange={(event) => onWeekStartChange(event.target.value)}
        className='teg-field h-12 w-full px-4 text-sm font-bold outline-none'
      />
      <span className='mt-2 block text-xs font-semibold text-ink-soft'>
        Report will be saved as {weekLabel}
      </span>
    </label>
  );
}
