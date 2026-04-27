import type { EmployeeKpiRow } from '@/lib/dashboard/types';
import { EmployeeSpotlight } from './EmployeeSpotlight';

type SpotlightConfig = {
  label: string;
  employee?: EmployeeKpiRow;
  metric: keyof EmployeeKpiRow;
  count: keyof EmployeeKpiRow;
  note: string;
};

export function EmployeeSpotlightSection({
  topReplay,
  topReviewAsk,
  topPreview,
}: {
  topReplay?: EmployeeKpiRow;
  topReviewAsk?: EmployeeKpiRow;
  topPreview?: EmployeeKpiRow;
}) {
  const spotlights: SpotlightConfig[] = [
    {
      label: 'Replay spotlight',
      employee: topReplay,
      metric: 'replaysSoldPercent',
      count: 'replaysSold',
      note: '',
    },
    {
      label: 'Review ask spotlight',
      employee: topReviewAsk,
      metric: 'reviewsAskedPercent',
      count: 'reviewsAsked',
      note: '',
    },
    {
      label: 'Preview spotlight',
      employee: topPreview,
      metric: 'previewsPercent',
      count: 'afterGamePreviews',
      note: '',
    },
  ];

  return (
    <section className='snappy-section overflow-visible'>
      <div className='mb-4 max-w-2xl'>
        <p className='font-tag text-sm font-black uppercase text-primary-web-red'>
          Team recognition
        </p>

        <h2 className='mt-2 font-heading text-2xl font-black text-cosmo-black'>
          Team wins to repeat
        </h2>

        <p className='mt-1 text-sm font-medium leading-6 text-ink-soft'>
          Highlight the team members leading each KPI and connect the result to the guest-focused
          behavior we want to see again.
        </p>
      </div>

      <div className='grid gap-4 overflow-visible px-1 pb-2 lg:grid-cols-3'>
        {spotlights.map((spotlight) => (
          <EmployeeSpotlight
            key={spotlight.label}
            label={spotlight.label}
            employee={spotlight.employee}
            metric={spotlight.metric}
            count={spotlight.count}
            note={spotlight.note}
          />
        ))}
      </div>
    </section>
  );
}
