import * as m from 'motion/react-m';

import type { EmployeeKpiRow } from '@/lib/dashboard/types';
import { listContainer, listItem } from '@/lib/motion';
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
      label: 'Replay leader',
      employee: topReplay,
      metric: 'replaysSoldPercent',
      count: 'replaysSold',
      note: 'Recognize the teammate turning great experiences into return visits.',
    },
    {
      label: 'Review ask leader',
      employee: topReviewAsk,
      metric: 'reviewsAskedPercent',
      count: 'reviewsAsked',
      note: 'Celebrate the teammate consistently asking guests to share their experience.',
    },
    {
      label: 'Preview leader',
      employee: topPreview,
      metric: 'previewsPercent',
      count: 'afterGamePreviews',
      note: 'Highlight the teammate helping guests get excited about their next adventure.',
    },
  ];

  return (
    <m.section layout className='snappy-section teg-panel overflow-visible p-5 text-cosmo-black'>
      <div className='mb-5 flex flex-col gap-2 border-b-2 border-cosmo-black/10 pb-5'>
        <p className='font-tag text-sm font-black uppercase text-primary-web-red'>
          Team recognition
        </p>

        <h2 className='font-heading text-2xl font-black leading-tight text-cosmo-black'>
          Wins worth repeating
        </h2>

        <p className='max-w-3xl text-sm font-medium leading-6 text-ink-soft'>
          Use these spotlights to recognize strong performance and coach the habits that create
          better guest moments.
        </p>
      </div>

      <m.div
        variants={listContainer}
        className='grid gap-4 overflow-visible px-1 pb-2 lg:grid-cols-3'>
        {spotlights.map((spotlight) => (
          <m.div key={spotlight.label} layout variants={listItem} className='h-full'>
            <EmployeeSpotlight
              label={spotlight.label}
              employee={spotlight.employee}
              metric={spotlight.metric}
              count={spotlight.count}
              note={spotlight.note}
            />
          </m.div>
        ))}
      </m.div>
    </m.section>
  );
}
