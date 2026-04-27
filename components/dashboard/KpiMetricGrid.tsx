import type { KpiCard } from '@/lib/dashboard/types';
import { KpiMetricCard } from './KpiMetricCard';

export function KpiMetricGrid({ metrics }: { metrics: KpiCard[] }) {
  return (
    <section className='snappy-section overflow-visible'>
      <div className='grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {metrics.map((metric) => (
          <KpiMetricCard key={metric.label} metric={metric} />
        ))}
      </div>
    </section>
  );
}
