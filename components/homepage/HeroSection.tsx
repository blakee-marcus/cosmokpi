const steps = [
  {
    number: '1',
    text: 'Open cOSmo and go to FLTM Reports.',
    className: 'bg-cosmo-black text-cosmo-white',
    textClassName: 'text-cosmo-white/80',
  },
  {
    number: '2',
    text: 'Confirm the report date range.',
    className: 'bg-blue text-cosmo-white',
    textClassName: 'text-cosmo-white/90',
  },
  {
    number: '3',
    text: 'Click Download CSV from the Game Guides report.',
    className: 'bg-purple text-cosmo-white',
    textClassName: 'text-cosmo-white/90',
  },
];

function StepCard({
  className,
  number,
  text,
  textClassName,
}: {
  className: string;
  number: string;
  text: string;
  textClassName: string;
}) {
  return (
    <div className={`rounded-[28px] p-5 shadow-[6px_7px_0_0_rgba(0,0,0,0.18)] ${className}`}>
      <p className='font-display text-4xl font-black'>{number}</p>
      <p className={`mt-3 text-sm font-semibold leading-6 ${textClassName}`}>{text}</p>
    </div>
  );
}

export function HeroSection() {
  return (
    <div className='space-y-8'>
      <div className='teg-eyebrow teg-eyebrow-red'>
        Internal KPI workflow
      </div>

      <div className='space-y-5'>
        <h1 className='font-display max-w-4xl text-5xl font-black leading-[0.95] text-cosmo-black sm:text-6xl lg:text-7xl'>
          Turn FLTM reports into a clear leadership snapshot.
        </h1>
        <p className='max-w-2xl text-lg font-medium leading-8 text-ink-soft sm:text-xl'>
          Download the weekly Game Guide CSV from cOSmo, upload it here, and create a local
          performance view that supports guest experience, coaching, recognition, and FLNL clarity.
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-3'>
        {steps.map((step) => (
          <StepCard key={step.number} {...step} />
        ))}
      </div>

      <div className='teg-card p-5'>
        <p className='font-heading text-xl font-black text-cosmo-black'>
          Built for Magic + Logic
        </p>
        <p className='mt-2 max-w-3xl text-sm font-medium leading-6 text-ink-soft'>
          This dashboard supports weekly reports that run Monday through Sunday. If your cOSmo
          report uses a different date range, the selected week may not align with the data in your
          upload.
        </p>
        <p className='mt-3 max-w-3xl text-sm font-medium leading-6 text-ink-soft'>
          Use the dashboard to celebrate strong guest-focused behaviors, identify coaching
          opportunities, and keep weekly communication concise, brand-focused, and actionable.
        </p>
      </div>
    </div>
  );
}
