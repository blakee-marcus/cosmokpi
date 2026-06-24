import { getEmployeeComparisonKey } from './comparison';
import { KPI_GOALS, MINIMUM_GAMES_FOR_RANKING, STEADY_DELTA_THRESHOLD } from './constants';
import { formatNumber, formatPercent, formatPointDelta, normalizePercent } from './formatters';
import { isManagementRole } from './roles';
import type { DashboardPeriod, EmployeeKpiRow, EmployeePercentMetricKey } from './types';

export type TrendState =
  | 'up'
  | 'down'
  | 'flat'
  | 'insufficientData'
  | 'newActivity'
  | 'noPriorBaseline';

type CoachingMetricKey = EmployeePercentMetricKey | 'totalGames';

type CoachingMetric = Readonly<{
  key: CoachingMetricKey;
  label: string;
  focus: CoachingFocus;
  strengthLabel: string;
  denominator: 'guests' | 'totalGames';
  goal?: number;
}>;

type CoachingFocus =
  | 'Review asks'
  | 'Replay conversion'
  | 'Preview asks'
  | 'Shared replay'
  | 'Game volume consistency'
  | 'Guest volume';

export type EmployeeTrendSummary = Readonly<{
  label: string;
  detail: string;
  state: TrendState;
}>;

export type TopPerformerInsight = Readonly<{
  name: string;
  strengthLabel: string;
  supportingEvidence: string;
  trend: TrendState;
}>;

export type MostImprovedInsight = Readonly<{
  name: string;
  improvedMetric: string;
  currentValue: number;
  previousValue: number;
  delta: number;
  trend: TrendState;
}>;

export type CoachingOpportunity = Readonly<{
  coachingFocus: CoachingFocus;
  supportingEvidence: string;
  teamMembers: string[];
}>;

export type CoachingAttentionItem = Readonly<{
  name: string;
  metricArea: CoachingFocus;
  supportingEvidence: string;
}>;

export type NeedsCoachingAttentionView = Readonly<{
  items: CoachingAttentionItem[];
  message: string | null;
}>;

export type PerformanceCoachingViewModel = Readonly<{
  hasEnoughData: boolean;
  periodType: DashboardPeriod['periodType'];
  periodLabel: string;
  storeName: string;
  topPerformers: TopPerformerInsight[];
  mostImproved: MostImprovedInsight[];
  coachingOpportunities: CoachingOpportunity[];
  needsCoachingAttention: NeedsCoachingAttentionView;
  insufficientDataMessage: string | null;
}>;

const FAIR_BOTTOM_QUARTILE_MINIMUM_EMPLOYEES = 4;
const MAX_INSIGHTS_PER_GROUP = 3;

const PERCENT_METRICS: CoachingMetric[] = [
  {
    key: 'replaysSoldPercent',
    label: 'Replay conversion',
    focus: 'Replay conversion',
    strengthLabel: 'Replay conversion',
    denominator: 'guests',
    goal: KPI_GOALS.replayPercent,
  },
  {
    key: 'reviewsAskedPercent',
    label: 'Review ask consistency',
    focus: 'Review asks',
    strengthLabel: 'Review ask consistency',
    denominator: 'totalGames',
    goal: KPI_GOALS.reviewsAskedPercent,
  },
  {
    key: 'previewsPercent',
    label: 'Preview asks',
    focus: 'Preview asks',
    strengthLabel: 'Preview asks',
    denominator: 'totalGames',
    goal: KPI_GOALS.previewsPercent,
  },
  {
    key: 'sharedReplayPercent',
    label: 'Shared replay',
    focus: 'Shared replay',
    strengthLabel: 'Shared replay',
    denominator: 'totalGames',
    goal: KPI_GOALS.sharedReplayPercent,
  },
];

const COUNT_METRICS: CoachingMetric[] = [
  {
    key: 'totalGames',
    label: 'Guest volume',
    focus: 'Game volume consistency',
    strengthLabel: 'Guest volume',
    denominator: 'totalGames',
  },
];

function getEligibleEmployees(employees: EmployeeKpiRow[]) {
  return employees.filter(
    (employee) =>
      Number(employee.totalGames) >= MINIMUM_GAMES_FOR_RANKING &&
      !isManagementRole(employee.role),
  );
}

function getMetricValue(employee: EmployeeKpiRow, metric: CoachingMetric) {
  const value = Number(employee[metric.key]);

  return metric.key.endsWith('Percent') ? normalizePercent(value) : value;
}

function getMetricEvidence(employee: EmployeeKpiRow, metric: CoachingMetric) {
  if (metric.key === 'totalGames') {
    return `${formatNumber(Number(employee.totalGames))} games hosted`;
  }

  const value = getMetricValue(employee, metric);
  const denominator =
    metric.denominator === 'guests'
      ? `${formatNumber(Number(employee.guests))} guests`
      : `${formatNumber(Number(employee.totalGames))} games`;

  return `${formatPercent(value)} from ${denominator}`;
}

function compareIdentity(a: EmployeeKpiRow, b: EmployeeKpiRow) {
  return String(a.name).localeCompare(String(b.name));
}

function compareByMetricDesc(metric: CoachingMetric) {
  return (a: EmployeeKpiRow, b: EmployeeKpiRow) => {
    const valueComparison = getMetricValue(b, metric) - getMetricValue(a, metric);
    if (valueComparison !== 0) return valueComparison;

    const gamesComparison = Number(b.totalGames) - Number(a.totalGames);
    if (gamesComparison !== 0) return gamesComparison;

    return compareIdentity(a, b);
  };
}

function getActionPlanTitle(coachingView: PerformanceCoachingViewModel) {
  const periodName = coachingView.periodType === 'monthly' ? 'Month' : 'Week';
  const storeName = coachingView.storeName.trim();

  return storeName
    ? `This ${periodName}’s Team Focus — ${storeName}`
    : `This ${periodName}’s Team Focus`;
}

function getFocusNoun(focus: CoachingFocus) {
  switch (focus) {
    case 'Replay conversion':
      return 'replay conversion';
    case 'Preview asks':
      return 'preview asks';
    case 'Shared replay':
      return 'shared replay';
    case 'Game volume consistency':
      return 'steady game follow-through';
    case 'Guest volume':
      return 'guest service follow-through';
    case 'Review asks':
    default:
      return 'review asks';
  }
}

function getFocusBehavior(focus: CoachingFocus) {
  switch (focus) {
    case 'Replay conversion':
      return 'Keep replay offers clear and connected to the guest experience.';
    case 'Preview asks':
      return 'invite each group to check out another open room while the excitement from their game is still fresh';
    case 'Shared replay':
      return 'Make shared replay part of the team’s game wrap-up rhythm.';
    case 'Game volume consistency':
      return 'Keep each handoff tight so games start smoothly and on time.';
    case 'Guest volume':
      return 'Keep service warm and ready as each group moves through the store.';
    case 'Review asks':
    default:
      return 'Keep review asks simple and consistent during each game.';
  }
}

function getSimpleAction(focus: CoachingFocus) {
  switch (focus) {
    case 'Replay conversion':
      return 'connect each replay offer to the moment guests just enjoyed';
    case 'Preview asks':
      return 'invite each group to check out another open room while the excitement from their game is still fresh';
    case 'Shared replay':
      return 'mention shared replay during the game wrap-up';
    case 'Game volume consistency':
      return 'finish each handoff clearly so the next game starts clean';
    case 'Guest volume':
      return 'stay ready for each group and keep service moving';
    case 'Review asks':
    default:
      return 'ask every group while the service moment is still fresh';
  }
}

function getPrimaryWin(coachingView: PerformanceCoachingViewModel) {
  const topPerformer = coachingView.topPerformers[0];

  if (topPerformer) {
    return {
      managerNote: `${topPerformer.name} led ${topPerformer.strengthLabel} with ${topPerformer.supportingEvidence}.`,
      huddleWin: `${topPerformer.name} leading ${topPerformer.strengthLabel}`,
    };
  }

  const mostImproved = coachingView.mostImproved[0];

  if (mostImproved) {
    return {
      managerNote: `${mostImproved.name} made progress on ${mostImproved.improvedMetric}.`,
      huddleWin: `${mostImproved.name} making progress on ${mostImproved.improvedMetric}`,
    };
  }

  return {
    managerNote: 'We have a new report saved and ready to review.',
    huddleWin: 'the work you’re putting in',
  };
}

function getPrimaryFollowUp(coachingView: PerformanceCoachingViewModel) {
  const attentionItem = coachingView.needsCoachingAttention.items[0];

  if (!attentionItem) return 'No individual follow-up is clear yet.';

  return `Check in privately with ${attentionItem.name} on ${attentionItem.metricArea}.`;
}

function getPrimaryFocus(coachingView: PerformanceCoachingViewModel): CoachingFocus {
  return (
    coachingView.needsCoachingAttention.items[0]?.metricArea ??
    coachingView.coachingOpportunities[0]?.coachingFocus ??
    'Review asks'
  );
}

function buildPreviousEmployeeMap(previousPeriod: DashboardPeriod | null) {
  const employeesByKey = new Map<string, EmployeeKpiRow>();

  previousPeriod?.employees.forEach((employee) => {
    employeesByKey.set(getEmployeeComparisonKey(employee), employee);
  });

  return employeesByKey;
}

export function getMetricDelta(currentValue: number, previousValue: number) {
  return normalizePercent(currentValue) - normalizePercent(previousValue);
}

export function getTrendDirection({
  currentValue,
  hasPreviousPeriod,
  previousValue,
}: {
  currentValue: number;
  hasPreviousPeriod: boolean;
  previousValue?: number;
}): TrendState {
  if (!hasPreviousPeriod) return 'insufficientData';

  if (previousValue === undefined || !Number.isFinite(previousValue)) return 'noPriorBaseline';

  const normalizedCurrent = normalizePercent(currentValue);
  const normalizedPrevious = normalizePercent(previousValue);

  if (normalizedPrevious === 0) {
    return normalizedCurrent > 0 ? 'newActivity' : 'noPriorBaseline';
  }

  const delta = normalizedCurrent - normalizedPrevious;

  if (Math.abs(delta) <= STEADY_DELTA_THRESHOLD) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

export function getEmployeeTrendSummary({
  employee,
  hasPreviousPeriod,
  previousEmployee,
}: {
  employee: EmployeeKpiRow;
  hasPreviousPeriod: boolean;
  previousEmployee?: EmployeeKpiRow;
}): EmployeeTrendSummary {
  if (!hasPreviousPeriod) {
    return {
      label: 'Insufficient trend data',
      detail: 'Add a prior comparable period',
      state: 'insufficientData',
    };
  }

  if (!previousEmployee) {
    return {
      label: 'New this period',
      detail: 'No matched prior row',
      state: 'noPriorBaseline',
    };
  }

  const strongestMovement = PERCENT_METRICS.map((metric) => {
    const currentValue = getMetricValue(employee, metric);
    const previousValue = getMetricValue(previousEmployee, metric);

    return {
      metric,
      currentValue,
      previousValue,
      delta: getMetricDelta(currentValue, previousValue),
      state: getTrendDirection({ currentValue, previousValue, hasPreviousPeriod }),
    };
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  if (!strongestMovement) {
    return {
      label: 'Insufficient trend data',
      detail: 'No KPI movement available',
      state: 'insufficientData',
    };
  }

  if (strongestMovement.state === 'flat') {
    return {
      label: 'Held steady',
      detail: 'No major KPI movement',
      state: 'flat',
    };
  }

  return {
    label: `${strongestMovement.metric.label} ${formatPointDelta(strongestMovement.delta)}`,
    detail:
      strongestMovement.state === 'newActivity'
        ? 'New activity from prior zero baseline'
        : 'Compared with prior period',
    state: strongestMovement.state,
  };
}

export function getTopPerformerInsights(
  selectedPeriod: DashboardPeriod,
  previousPeriod: DashboardPeriod | null,
): TopPerformerInsight[] {
  const previousEmployeesByKey = buildPreviousEmployeeMap(previousPeriod);
  const eligibleEmployees = getEligibleEmployees(selectedPeriod.employees);

  return [...PERCENT_METRICS, ...COUNT_METRICS]
    .map((metric) => {
      const leader = [...eligibleEmployees]
        .filter((employee) => Number(employee[metric.denominator]) > 0)
        .sort(compareByMetricDesc(metric))[0];

      if (!leader) return null;

      const previousEmployee = previousEmployeesByKey.get(getEmployeeComparisonKey(leader));
      const trend =
        metric.key === 'totalGames'
          ? getTrendDirection({
              currentValue: Number(leader.totalGames),
              previousValue: previousEmployee ? Number(previousEmployee.totalGames) : undefined,
              hasPreviousPeriod: Boolean(previousPeriod),
            })
          : getTrendDirection({
              currentValue: getMetricValue(leader, metric),
              previousValue: previousEmployee
                ? getMetricValue(previousEmployee, metric)
                : undefined,
              hasPreviousPeriod: Boolean(previousPeriod),
            });

      return {
        name: String(leader.name),
        strengthLabel: metric.strengthLabel,
        supportingEvidence: getMetricEvidence(leader, metric),
        trend,
      };
    })
    .filter((insight): insight is TopPerformerInsight => Boolean(insight))
    .slice(0, MAX_INSIGHTS_PER_GROUP);
}

export function getMostImprovedInsights(
  selectedPeriod: DashboardPeriod,
  previousPeriod: DashboardPeriod | null,
): MostImprovedInsight[] {
  if (!previousPeriod) return [];

  const previousEmployeesByKey = buildPreviousEmployeeMap(previousPeriod);

  return getEligibleEmployees(selectedPeriod.employees)
    .map((employee) => {
      const previousEmployee = previousEmployeesByKey.get(getEmployeeComparisonKey(employee));
      if (!previousEmployee) return null;

      const bestImprovement = PERCENT_METRICS.map((metric) => {
        const currentValue = getMetricValue(employee, metric);
        const previousValue = getMetricValue(previousEmployee, metric);
        const delta = getMetricDelta(currentValue, previousValue);

        return {
          metric,
          currentValue,
          previousValue,
          delta,
        };
      })
        .filter((movement) => movement.delta > STEADY_DELTA_THRESHOLD)
        .sort((a, b) => b.delta - a.delta)[0];

      if (!bestImprovement) return null;

      return {
        name: String(employee.name),
        improvedMetric: bestImprovement.metric.label,
        currentValue: bestImprovement.currentValue,
        previousValue: bestImprovement.previousValue,
        delta: bestImprovement.delta,
        trend: getTrendDirection({
          currentValue: bestImprovement.currentValue,
          previousValue: bestImprovement.previousValue,
          hasPreviousPeriod: true,
        }),
        games: Number(employee.totalGames),
      };
    })
    .filter((insight): insight is MostImprovedInsight & { games: number } => Boolean(insight))
    .sort((a, b) => {
      const deltaComparison = b.delta - a.delta;
      if (deltaComparison !== 0) return deltaComparison;

      const gamesComparison = b.games - a.games;
      if (gamesComparison !== 0) return gamesComparison;

      return a.name.localeCompare(b.name);
    })
    .slice(0, MAX_INSIGHTS_PER_GROUP)
    .map((insight) => ({
      name: insight.name,
      improvedMetric: insight.improvedMetric,
      currentValue: insight.currentValue,
      previousValue: insight.previousValue,
      delta: insight.delta,
      trend: insight.trend,
    }));
}

export function getCoachingOpportunities(selectedPeriod: DashboardPeriod): CoachingOpportunity[] {
  const eligibleEmployees = getEligibleEmployees(selectedPeriod.employees);

  return PERCENT_METRICS.map((metric) => {
    const goal = metric.goal ?? 0;
    const teamMembers = [...eligibleEmployees]
      .filter((employee) => getMetricValue(employee, metric) < goal)
      .sort((a, b) => {
        const valueComparison = getMetricValue(a, metric) - getMetricValue(b, metric);
        if (valueComparison !== 0) return valueComparison;

        const gamesComparison = Number(b.totalGames) - Number(a.totalGames);
        if (gamesComparison !== 0) return gamesComparison;

        return compareIdentity(a, b);
      })
      .slice(0, MAX_INSIGHTS_PER_GROUP);

    if (teamMembers.length === 0) return null;

    const lowestValue = getMetricValue(teamMembers[0], metric);

    return {
      coachingFocus: metric.focus,
      supportingEvidence: `${teamMembers.length} eligible team member${
        teamMembers.length === 1 ? '' : 's'
      } below ${formatPercent(goal)}; lowest current view is ${formatPercent(lowestValue)}.`,
      teamMembers: teamMembers.map((employee) => String(employee.name)),
    };
  }).filter((opportunity): opportunity is CoachingOpportunity => Boolean(opportunity));
}

export function getNeedsCoachingAttention(
  selectedPeriod: DashboardPeriod,
): NeedsCoachingAttentionView {
  const eligibleEmployees = getEligibleEmployees(selectedPeriod.employees);

  if (eligibleEmployees.length < FAIR_BOTTOM_QUARTILE_MINIMUM_EMPLOYEES) {
    return {
      items: [],
      message: 'Not enough eligible team members for a fair bottom-quartile view.',
    };
  }

  const rankedAttention = [...eligibleEmployees]
    .map((employee) => {
      const weakestMetric = PERCENT_METRICS.map((metric) => {
        const goal = metric.goal ?? 0;
        const value = getMetricValue(employee, metric);

        return {
          metric,
          value,
          gap: goal - value,
        };
      }).sort((a, b) => b.gap - a.gap)[0];

      return {
        employee,
        metric: weakestMetric.metric,
        value: weakestMetric.value,
        gap: weakestMetric.gap,
      };
    })
    .filter((item) => item.gap > 0)
    .sort((a, b) => {
      const gapComparison = b.gap - a.gap;
      if (gapComparison !== 0) return gapComparison;

      const gamesComparison = Number(b.employee.totalGames) - Number(a.employee.totalGames);
      if (gamesComparison !== 0) return gamesComparison;

      return compareIdentity(a.employee, b.employee);
    });

  const attentionCount = Math.max(1, Math.floor(eligibleEmployees.length / 4));

  return {
    items: rankedAttention.slice(0, attentionCount).map((item) => ({
      name: String(item.employee.name),
      metricArea: item.metric.focus,
      supportingEvidence: `${formatPercent(item.value)} current ${item.metric.label.toLowerCase()} across ${formatNumber(
        Number(item.employee.totalGames),
      )} games.`,
    })),
    message: null,
  };
}

export function buildPerformanceCoachingViewModel({
  previousPeriod,
  selectedPeriod,
}: {
  selectedPeriod: DashboardPeriod;
  previousPeriod: DashboardPeriod | null;
}): PerformanceCoachingViewModel {
  const eligibleEmployeeCount = getEligibleEmployees(selectedPeriod.employees).length;
  const hasEnoughData = eligibleEmployeeCount > 0;

  return {
    hasEnoughData,
    periodType: selectedPeriod.periodType,
    periodLabel: selectedPeriod.periodLabel,
    storeName: selectedPeriod.storeName,
    topPerformers: hasEnoughData ? getTopPerformerInsights(selectedPeriod, previousPeriod) : [],
    mostImproved: hasEnoughData ? getMostImprovedInsights(selectedPeriod, previousPeriod) : [],
    coachingOpportunities: hasEnoughData ? getCoachingOpportunities(selectedPeriod) : [],
    needsCoachingAttention: hasEnoughData
      ? getNeedsCoachingAttention(selectedPeriod)
      : {
          items: [],
          message: 'Not enough eligible team members for a fair bottom-quartile view.',
        },
    insufficientDataMessage: hasEnoughData
      ? null
      : `Add team members with at least ${MINIMUM_GAMES_FOR_RANKING} games before using performance views.`,
  };
}

export function buildLeadershipActionPlanText(coachingView: PerformanceCoachingViewModel) {
  const title = getActionPlanTitle(coachingView);
  const periodLabel = coachingView.periodLabel.trim();
  const periodLine = periodLabel ? `${periodLabel}\n\n` : '';
  const periodNoun = coachingView.periodType === 'monthly' ? 'month' : 'week';

  if (!coachingView.hasEnoughData) {
    return `${title}
${periodLine}Manager notes:
- Celebrate: We have a new report saved and ready to review.
- Follow up: No individual follow-up is clear yet.
- Team focus: Choose one clear behavior to reinforce this ${periodNoun}.

Huddle note:
Team, thank you for the work you’re putting in. This ${periodNoun}, we’re going to choose one clear focus, keep it simple, and follow through together.`;
  }

  const win = getPrimaryWin(coachingView);
  const focus = getPrimaryFocus(coachingView);
  const focusNoun = getFocusNoun(focus);

  return `${title}
${periodLine}Manager notes:
- Celebrate: ${win.managerNote}
- Follow up: ${getPrimaryFollowUp(coachingView)}
- Team focus: ${getFocusBehavior(focus)}

Huddle note:
Team, great work on ${win.huddleWin}. This ${periodNoun}, our focus is ${focusNoun}. Let’s keep it simple: ${getSimpleAction(
    focus,
  )}. Thank you for continuing to take care of our guests and each other.`;
}
