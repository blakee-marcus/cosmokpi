const steps = [
  {
    number: '1',
    text: 'Upload the weekly cOSmo CSV.',
    className: 'bg-cosmo-black text-cosmo-white',
    textClassName: 'text-cosmo-white/80',
  },
  {
    number: '2',
    text: 'Confirm the reporting week.',
    className: 'bg-blue text-cosmo-white',
    textClassName: 'text-cosmo-white/90',
  },
  {
    number: '3',
    text: 'Create a clear team view.',
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
      <div className='font-tag inline-flex rounded-full bg-primary-web-red px-4 py-2 text-sm font-black uppercase text-cosmo-white shadow-[3px_4px_0_0_var(--primary-web-red-dark)]'>
        TEG KPI Clarity
      </div>

      <div className='space-y-5'>
        <h1 className='font-display max-w-4xl text-5xl font-black leading-[0.95] text-cosmo-black sm:text-6xl lg:text-7xl'>
          Use KPI data to lead with clarity.
        </h1>
        <p className='max-w-2xl text-lg font-medium leading-8 text-ink-soft sm:text-xl'>
          Upload the weekly Game Guide KPI CSV, confirm the report week, and create a local team
          performance view that supports guest experience, coaching, and FLNL clarity.
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-3'>
        {steps.map((step) => (
          <StepCard key={step.number} {...step} />
        ))}
      </div>

      <div className='rounded-[28px] border-2 border-cosmo-black/10 bg-cosmo-white p-5 shadow-[5px_6px_0_0_rgba(0,0,0,0.08)]'>
        <p className='font-heading text-xl font-black text-cosmo-black'>Built for Magic + Logic</p>
        <p className='mt-2 max-w-3xl text-sm font-medium leading-6 text-ink-soft'>
          Use the dashboard to celebrate strong guest-focused behaviors, coach clear next steps,
          and keep weekly communication concise, brand-focused, and actionable.
        </p>
      </div>
    </div>
  );
}
