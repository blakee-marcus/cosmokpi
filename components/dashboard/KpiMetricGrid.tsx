import type { KpiCard } from '@/lib/dashboard/types';
import { KpiMetricCard } from './KpiMetricCard';

export function KpiMetricGrid({ metrics }: { metrics: KpiCard[] }) {
  return (
    <section className='snappy-section grid gap-4 lg:grid-cols-4'>
      {metrics.map((metric) => (
        <KpiMetricCard key={metric.label} metric={metric} />
      ))}
    </section>
  );
}
