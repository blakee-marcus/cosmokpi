import * as m from 'motion/react-m';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { formatPercent, formatPointDelta } from '@/lib/dashboard/formatters';
import type {
  MostImprovedInsight,
  PerformanceCoachingViewModel,
  TopPerformerInsight,
  TrendState,
} from '@/lib/dashboard/coaching';
import { listContainer, listItem } from '@/lib/motion';

type PerformanceCoachingSectionProps = Readonly<{
  actionPlanText: string;
  coachingView: PerformanceCoachingViewModel;
  onCopyActionPlan: (text: string) => Promise<void>;
}>;

type InsightCardProps = Readonly<{
  eyebrow: string;
  title: string;
  detail: string;
  trend?: TrendState;
}>;

const trendLabels: Record<TrendState, string> = {
  up: 'Moving up',
  down: 'Needs follow-up',
  flat: 'Steady',
  insufficientData: 'More data needed',
  newActivity: 'New activity',
  noPriorBaseline: 'New this period',
};

function humanizeEvidence(copy: string) {
  return copy
    .replace(/\bthe lowest current view is ([^.]+)\./gi, 'the lowest current result is $1.')
    .replace(/\blowest current view is ([^.]+)\./gi, 'current low point: $1.')
    .replace(/\bthe highest current view is ([^.]+)\./gi, 'the strongest current result is $1.')
    .replace(/\bhighest current view is ([^.]+)\./gi, 'strongest current result: $1.')
    .replace(/\bcurrent view\b/gi, 'current result')
    .replace(/\bprior comparable period\b/gi, 'prior period')
    .replace(/\binsufficient trend data\b/gi, 'not enough trend data')
    .trim();
}

function TrendPill({ trend }: { trend: TrendState }) {
  const className =
    trend === 'up' || trend === 'newActivity'
      ? 'bg-kpi-green text-cosmo-white'
      : trend === 'down'
        ? 'bg-kpi-red text-cosmo-white'
        : 'bg-comic-fog text-ink-soft';

  return (
    <span
      className={`font-tag inline-flex min-h-7 items-center rounded-full px-3 text-[11px] font-black uppercase leading-none ${className}`}>
      {trendLabels[trend]}
    </span>
  );
}

function InsightCard({ detail, eyebrow, title, trend }: InsightCardProps) {
  return (
    <article className='h-full rounded-[24px] border-2 border-cosmo-black bg-cosmo-white p-4 shadow-[4px_5px_0_0_rgba(17,17,17,1)]'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0'>
          <p className='font-tag text-xs font-black uppercase text-primary-web-red'>{eyebrow}</p>
          <h3 className='mt-2 truncate font-heading text-lg font-black leading-tight text-cosmo-black'>
            {title}
          </h3>
        </div>

        {trend ? <TrendPill trend={trend} /> : null}
      </div>

      <p className='mt-3 text-sm font-semibold leading-6 text-ink-soft'>
        {humanizeEvidence(detail)}
      </p>
    </article>
  );
}

function EmptyPanel({ children }: { children: ReactNode }) {
  return (
    <div className='rounded-[24px] border-2 border-dashed border-cosmo-black/30 bg-cosmo-white p-5'>
      <p className='text-sm font-semibold leading-6 text-ink-soft'>{children}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className='mb-3'>
      <p className='font-tag text-xs font-black uppercase text-primary-web-red'>{eyebrow}</p>
      <h3 className='mt-1 font-heading text-xl font-black leading-tight text-cosmo-black'>
        {title}
      </h3>
      <p className='mt-1 text-sm font-semibold leading-6 text-ink-soft'>{description}</p>
    </div>
  );
}

function TopPerformerCard({ insight }: { insight: TopPerformerInsight }) {
  return (
    <InsightCard
      eyebrow={insight.strengthLabel}
      title={insight.name}
      detail={insight.supportingEvidence}
      trend={insight.trend}
    />
  );
}

function MostImprovedCard({ insight }: { insight: MostImprovedInsight }) {
  return (
    <InsightCard
      eyebrow={insight.improvedMetric}
      title={insight.name}
      detail={`${formatPercent(insight.previousValue)} → ${formatPercent(
        insight.currentValue,
      )} (${formatPointDelta(insight.delta)})`}
      trend={insight.trend}
    />
  );
}

export function PerformanceCoachingSection({
  actionPlanText,
  coachingView,
  onCopyActionPlan,
}: PerformanceCoachingSectionProps) {
  const priorPeriodLabel = coachingView.periodType === 'monthly' ? 'month' : 'week';
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  async function handleCopyActionPlan() {
    setCopyStatus('idle');

    try {
      await onCopyActionPlan(actionPlanText);
      setCopyStatus('success');
    } catch {
      setCopyStatus('error');
    }
  }

  return (
    <m.section layout className='snappy-section teg-panel overflow-hidden text-cosmo-black'>
      <div className='border-b-2 border-cosmo-black/10 bg-comic-fog p-5'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <p className='font-tag text-sm font-black uppercase text-primary-web-red'>
              Leadership focus
            </p>

            <h2 className='mt-2 font-heading text-3xl font-black leading-tight text-cosmo-black'>
              Recognition and coaching
            </h2>

            <p className='mt-2 max-w-3xl text-sm font-semibold leading-6 text-ink-soft'>
              Use this view to choose who to celebrate, who to follow up with, and which behaviors
              need attention next.
            </p>
          </div>

          <div className='flex shrink-0 flex-col items-start gap-2 lg:items-end'>
            <button
              type='button'
              onClick={handleCopyActionPlan}
              className='font-tag inline-flex min-h-11 items-center justify-center rounded-full border-2 border-cosmo-black bg-primary-web-red px-4 text-xs font-black uppercase text-cosmo-white shadow-[3px_4px_0_0_rgba(17,17,17,1)] transition hover:-translate-y-0.5 hover:shadow-[4px_5px_0_0_rgba(17,17,17,1)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-cosmo-yellow'>
              Copy action plan
            </button>

            <p aria-live='polite' className='min-h-5 text-sm font-bold text-ink-soft'>
              {copyStatus === 'success'
                ? 'Action plan copied.'
                : copyStatus === 'error'
                  ? 'Copy failed. Select and copy the notes manually.'
                  : ''}
            </p>
          </div>
        </div>
      </div>

      <div className='space-y-6 p-5'>
        {!coachingView.hasEnoughData ? (
          <EmptyPanel>
            {coachingView.insufficientDataMessage ??
              'Add more eligible team member data before using coaching views.'}
          </EmptyPanel>
        ) : (
          <>
            <div className='grid gap-5 xl:grid-cols-2'>
              <section className='rounded-[28px] border-2 border-cosmo-black/10 bg-off-white p-4'>
                <SectionHeading
                  eyebrow='Celebrate'
                  title='Top performers'
                  description='Recognize the team members setting the strongest example right now.'
                />

                {coachingView.topPerformers.length ? (
                  <m.div variants={listContainer} className='grid gap-3 md:grid-cols-2'>
                    {coachingView.topPerformers.map((insight) => (
                      <m.div key={`${insight.strengthLabel}:${insight.name}`} variants={listItem}>
                        <TopPerformerCard insight={insight} />
                      </m.div>
                    ))}
                  </m.div>
                ) : (
                  <EmptyPanel>
                    More qualifying games are needed before highlighting top performers.
                  </EmptyPanel>
                )}
              </section>

              <section className='rounded-[28px] border-2 border-cosmo-black/10 bg-off-white p-4'>
                <SectionHeading
                  eyebrow='Encourage'
                  title='Most improved'
                  description='Call out visible progress and reinforce the habits behind it.'
                />

                {coachingView.mostImproved.length ? (
                  <m.div variants={listContainer} className='grid gap-3 md:grid-cols-2'>
                    {coachingView.mostImproved.map((insight) => (
                      <m.div key={`${insight.improvedMetric}:${insight.name}`} variants={listItem}>
                        <MostImprovedCard insight={insight} />
                      </m.div>
                    ))}
                  </m.div>
                ) : (
                  <EmptyPanel>
                    Add a comparable prior {priorPeriodLabel} to identify meaningful improvement.
                  </EmptyPanel>
                )}
              </section>
            </div>

            <div className='grid gap-5 xl:grid-cols-[1.15fr_0.85fr]'>
              <section className='rounded-[28px] border-2 border-cosmo-black/10 bg-off-white p-4'>
                <SectionHeading
                  eyebrow='Coach'
                  title='Team opportunity areas'
                  description='Use these patterns to choose the next team-wide coaching focus.'
                />

                {coachingView.coachingOpportunities.length ? (
                  <div className='grid gap-3'>
                    {coachingView.coachingOpportunities.map((opportunity) => (
                      <article
                        key={opportunity.coachingFocus}
                        className='rounded-[24px] border-2 border-cosmo-black bg-cosmo-white p-4 shadow-[4px_5px_0_0_rgba(17,17,17,1)]'>
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                          <div>
                            <p className='font-heading text-lg font-black text-cosmo-black'>
                              {opportunity.coachingFocus}
                            </p>
                            <p className='mt-1 text-sm font-semibold leading-6 text-ink-soft'>
                              {humanizeEvidence(opportunity.supportingEvidence)}
                            </p>
                          </div>

                          <p className='font-tag max-w-full rounded-full bg-comic-fog px-3 py-2 text-xs font-black uppercase text-ink-soft sm:max-w-[16rem]'>
                            {opportunity.teamMembers.join(', ')}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyPanel>No clear team opportunity area is showing yet.</EmptyPanel>
                )}
              </section>

              <section className='rounded-[28px] border-2 border-cosmo-black/10 bg-off-white p-4'>
                <SectionHeading
                  eyebrow='Follow up'
                  title='Needs attention'
                  description='Start with a quick check-in, then coach the specific behavior.'
                />

                {coachingView.needsCoachingAttention.items.length ? (
                  <div className='grid gap-3'>
                    {coachingView.needsCoachingAttention.items.map((item) => (
                      <InsightCard
                        key={`${item.metricArea}:${item.name}`}
                        eyebrow={item.metricArea}
                        title={item.name}
                        detail={item.supportingEvidence}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyPanel>
                    {coachingView.needsCoachingAttention.message ??
                      'No needs-attention signals are showing for this period.'}
                  </EmptyPanel>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </m.section>
  );
}
