import * as m from 'motion/react-m';

import type { KpiCard } from '@/lib/dashboard/types';
import { listContainer, listItem } from '@/lib/motion';
import { KpiMetricCard } from './KpiMetricCard';

export function KpiMetricGrid({ metrics }: { metrics: KpiCard[] }) {
  return (
    <m.section layout aria-label='Store KPI snapshot' className='snappy-section overflow-visible'>
      <m.div
        variants={listContainer}
        className='grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {metrics.map((metric) => (
          <m.div key={metric.label} layout variants={listItem} className='h-full'>
            <KpiMetricCard metric={metric} />
          </m.div>
        ))}
      </m.div>
    </m.section>
  );
}
