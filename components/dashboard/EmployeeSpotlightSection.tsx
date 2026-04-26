import type { EmployeeKpiRow } from '@/lib/dashboard/types';
import { EmployeeSpotlight } from './EmployeeSpotlight';

export function EmployeeSpotlightSection({
  topReplay,
  topReviewAsk,
  topPreview,
}: {
  topReplay?: EmployeeKpiRow;
  topReviewAsk?: EmployeeKpiRow;
  topPreview?: EmployeeKpiRow;
}) {
  return (
    <section className='snappy-section'>
      <div className='mb-4'>
        <p className='font-tag text-sm font-black uppercase text-primary-web-red'>
          Team recognition
        </p>

        <h2 className='font-heading mt-2 text-2xl font-black'>Spotlight-worthy results</h2>

        <p className='mt-1 text-sm font-medium leading-6 text-ink-soft'>
          Highlight the team members leading each KPI, then connect the result back to the behavior
          we want to repeat.
        </p>
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        <EmployeeSpotlight
          label='Replay spotlight'
          employee={topReplay}
          metric='replaysSoldPercent'
          count='replaysSold'
          note='Recognize the outro, confidence, and guest connection behind this result.'
        />

        <EmployeeSpotlight
          label='Review ask spotlight'
          employee={topReviewAsk}
          metric='reviewsAskedPercent'
          count='reviewsAsked'
          note='Celebrate the consistency of asking clearly and making the review feel personal.'
        />

        <EmployeeSpotlight
          label='Preview spotlight'
          employee={topPreview}
          metric='previewsPercent'
          count='afterGamePreviews'
          note='Call out the way this team member builds excitement for the next adventure.'
        />
      </div>
    </section>
  );
}
