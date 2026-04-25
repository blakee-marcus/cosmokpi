'use client';

import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';

type EmployeeKpiRow = {
  name: string;
  storeName: string;
  role: string;
  totalGames: number;
  guests: number;
  replaysSold: number;
  SUEs: number;
  reviewsAsked: number;
  sharedReplay: number;
  afterGamePreviews: number;
  replaysSoldPercent: number;
  suePercent: number;
  reviewsAskedPercent: number;
  sharedReplayPercent: number;
  previewsPercent: number;
  [key: string]: string | number;
};

type StoredWeek = {
  id: string;
  weekStart: string;
  weekLabel: string;
  fileName: string;
  uploadedAt: string;
  storeName: string;
  totals: {
    employees: number;
    totalGames: number;
    guests: number;
    replaysSold: number;
    reviewsAsked: number;
    sharedReplay: number;
    afterGamePreviews: number;
  };
  employees: EmployeeKpiRow[];
};

type KpiStorage = {
  version: 1;
  latestWeekId: string | null;
  weeks: StoredWeek[];
};

type KpiCard = {
  label: string;
  value: number;
  goal: number;
  detail: string;
  direction: 'higher' | 'lower';
};

type Status = 'onTrack' | 'watch' | 'needsFocus';
type ProgressStatus = 'improved' | 'steady' | 'needsFollowUp';

type StoreKpiRates = {
  replayPercent: number;
  reviewsAskedPercent: number;
  sharedReplayPercent: number;
  previewsPercent: number;
};

type WeekProgressMetric = {
  label: string;
  value: number;
  previousValue: number;
  delta: number;
  goal: number;
  detail: string;
};

type EmployeePercentMetricKey =
  | 'replaysSoldPercent'
  | 'reviewsAskedPercent'
  | 'sharedReplayPercent'
  | 'previewsPercent';

type EmployeeProgressSummary = {
  label: string;
  detail: string;
  status: ProgressStatus | null;
};

type SortKey =
  | 'name'
  | 'totalGames'
  | 'guests'
  | 'replaysSoldPercent'
  | 'reviewsAskedPercent'
  | 'sharedReplayPercent'
  | 'previewsPercent';

const STORAGE_KEY = 'employee-kpi-dashboard:v1';
const MINIMUM_GAMES_FOR_RANKING = 5;
const STEADY_DELTA_THRESHOLD = 0.1;

const EMPTY_STORAGE: KpiStorage = {
  version: 1,
  latestWeekId: null,
  weeks: [],
};

let cachedStorageRaw: string | null = null;
let cachedStorageSnapshot: KpiStorage = EMPTY_STORAGE;

const KPI_GOALS = {
  replayPercent: 15,
  reviewsAskedPercent: 90,
  sharedReplayPercent: 90,
  previewsPercent: 90,
};

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Replay conversion', value: 'replaysSoldPercent' },
  { label: 'Review ask rate', value: 'reviewsAskedPercent' },
  { label: 'Shared replay rate', value: 'sharedReplayPercent' },
  { label: 'Preview ask rate', value: 'previewsPercent' },
  { label: 'Games hosted', value: 'totalGames' },
  { label: 'Guests served', value: 'guests' },
  { label: 'Name', value: 'name' },
];

const EMPLOYEE_PROGRESS_METRICS: { label: string; metric: EmployeePercentMetricKey }[] = [
  { label: 'Replay', metric: 'replaysSoldPercent' },
  { label: 'Review', metric: 'reviewsAskedPercent' },
  { label: 'Shared replay', metric: 'sharedReplayPercent' },
  { label: 'Preview', metric: 'previewsPercent' },
];

function getStorage(): KpiStorage {
  if (typeof window === 'undefined') {
    return EMPTY_STORAGE;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return EMPTY_STORAGE;
  }

  try {
    return JSON.parse(stored) as KpiStorage;
  } catch {
    return EMPTY_STORAGE;
  }
}

function getStorageSnapshot() {
  if (typeof window === 'undefined') {
    return EMPTY_STORAGE;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored === cachedStorageRaw) {
    return cachedStorageSnapshot;
  }

  cachedStorageRaw = stored;
  cachedStorageSnapshot = getStorage();
  return cachedStorageSnapshot;
}

function subscribeToStorage(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

function formatNewsletterPercent(value: number) {
  if (!Number.isFinite(value)) return '-';

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.00$/, '').replace(/0$/, '');
}

function safePercent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return (numerator / denominator) * 100;
}

function normalizePercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return value <= 1 && value >= 0 ? value * 100 : value;
}

function normalizeComparisonValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getEmployeeComparisonKey(employee: Pick<EmployeeKpiRow, 'name' | 'storeName'>) {
  return `${normalizeComparisonValue(String(employee.name))}:${normalizeComparisonValue(
    String(employee.storeName),
  )}`;
}

function getStoreComparisonKey(storeName: string) {
  return normalizeComparisonValue(storeName);
}

function getStoreKpiRates(week: StoredWeek): StoreKpiRates {
  return {
    replayPercent: safePercent(week.totals.replaysSold, week.totals.guests),
    reviewsAskedPercent: safePercent(week.totals.reviewsAsked, week.totals.totalGames),
    sharedReplayPercent: safePercent(week.totals.sharedReplay, week.totals.totalGames),
    previewsPercent: safePercent(week.totals.afterGamePreviews, week.totals.totalGames),
  };
}

function findPreviousWeekForStore(weeks: StoredWeek[], selectedWeek: StoredWeek) {
  const selectedStoreKey = getStoreComparisonKey(selectedWeek.storeName);

  return (
    [...weeks]
      .filter((week) => {
        return (
          week.id !== selectedWeek.id &&
          getStoreComparisonKey(week.storeName) === selectedStoreKey &&
          week.weekStart < selectedWeek.weekStart
        );
      })
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0] ?? null
  );
}

function getProgressStatus(delta: number): ProgressStatus {
  if (delta > STEADY_DELTA_THRESHOLD) return 'improved';
  if (delta < -STEADY_DELTA_THRESHOLD) return 'needsFollowUp';
  return 'steady';
}

function getProgressLabel(status: ProgressStatus) {
  switch (status) {
    case 'improved':
      return 'Improved';
    case 'steady':
      return 'Held steady';
    default:
      return 'Needs follow-up';
  }
}

function getProgressClasses(status: ProgressStatus) {
  switch (status) {
    case 'improved':
      return {
        card: 'border-kpi-green/50 bg-[#E5F9D7] text-cosmo-black shadow-[5px_6px_0_0_rgba(41,137,42,0.18)]',
        pill: 'bg-kpi-green text-cosmo-white',
        text: 'text-kpi-green',
      };
    case 'steady':
      return {
        card: 'border-kpi-yellow/70 bg-[#F9E8A5] text-cosmo-black shadow-[5px_6px_0_0_rgba(232,195,73,0.24)]',
        pill: 'bg-kpi-yellow text-cosmo-black',
        text: 'text-[#7A5A00]',
      };
    default:
      return {
        card: 'border-kpi-red/50 bg-[#FCCFCD] text-cosmo-black shadow-[5px_6px_0_0_rgba(179,38,30,0.18)]',
        pill: 'bg-kpi-red text-cosmo-white',
        text: 'text-kpi-red',
      };
  }
}

function formatPointDelta(delta: number) {
  if (!Number.isFinite(delta)) return '0.0 pts';

  const rounded =
    Math.abs(delta) <= STEADY_DELTA_THRESHOLD ? 0 : Number(delta.toFixed(1));
  const sign = rounded > 0 ? '+' : '';

  return `${sign}${rounded.toFixed(1)} pts`;
}

function buildWeekProgressMetrics(
  selectedWeek: StoredWeek,
  previousWeek: StoredWeek,
): WeekProgressMetric[] {
  const currentRates = getStoreKpiRates(selectedWeek);
  const previousRates = getStoreKpiRates(previousWeek);

  return [
    {
      label: 'Replay conversion',
      value: currentRates.replayPercent,
      previousValue: previousRates.replayPercent,
      delta: currentRates.replayPercent - previousRates.replayPercent,
      goal: KPI_GOALS.replayPercent,
      detail: 'Replay sales compared with guest volume.',
    },
    {
      label: 'Review ask rate',
      value: currentRates.reviewsAskedPercent,
      previousValue: previousRates.reviewsAskedPercent,
      delta: currentRates.reviewsAskedPercent - previousRates.reviewsAskedPercent,
      goal: KPI_GOALS.reviewsAskedPercent,
      detail: 'Review asks compared with games hosted.',
    },
    {
      label: 'Shared replay rate',
      value: currentRates.sharedReplayPercent,
      previousValue: previousRates.sharedReplayPercent,
      delta: currentRates.sharedReplayPercent - previousRates.sharedReplayPercent,
      goal: KPI_GOALS.sharedReplayPercent,
      detail: 'Shared replay moments compared with games hosted.',
    },
    {
      label: 'Preview ask rate',
      value: currentRates.previewsPercent,
      previousValue: previousRates.previewsPercent,
      delta: currentRates.previewsPercent - previousRates.previewsPercent,
      goal: KPI_GOALS.previewsPercent,
      detail: 'Preview asks compared with games hosted.',
    },
  ];
}

function getProgressSummary(metrics: WeekProgressMetric[]) {
  const improvedCount = metrics.filter(
    (metric) => getProgressStatus(metric.delta) === 'improved',
  ).length;
  const steadyCount = metrics.filter((metric) => getProgressStatus(metric.delta) === 'steady')
    .length;
  const needsFollowUpCount = metrics.filter(
    (metric) => getProgressStatus(metric.delta) === 'needsFollowUp',
  ).length;
  const strongestGain =
    [...metrics]
      .filter((metric) => getProgressStatus(metric.delta) === 'improved')
      .sort((a, b) => b.delta - a.delta)[0] ?? null;
  const priorityFollowUp =
    [...metrics]
      .filter((metric) => getProgressStatus(metric.delta) === 'needsFollowUp')
      .sort((a, b) => a.delta - b.delta)[0] ?? null;

  return {
    improvedCount,
    steadyCount,
    needsFollowUpCount,
    strongestGain,
    priorityFollowUp,
  };
}

function getEmployeeProgressSummary(
  employee: EmployeeKpiRow,
  previousEmployee: EmployeeKpiRow | undefined,
  hasPreviousWeek: boolean,
): EmployeeProgressSummary {
  if (!hasPreviousWeek) {
    return {
      label: 'No prior week',
      detail: 'Add another report',
      status: null,
    };
  }

  if (!previousEmployee) {
    return {
      label: 'New this week',
      detail: 'No matched prior row',
      status: null,
    };
  }

  const movements = EMPLOYEE_PROGRESS_METRICS.map(({ label, metric }) => {
    const currentValue = normalizePercent(Number(employee[metric]));
    const previousValue = normalizePercent(Number(previousEmployee[metric]));

    return {
      label,
      delta: currentValue - previousValue,
    };
  });

  const largestMovement = [...movements].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  if (!largestMovement || Math.abs(largestMovement.delta) <= STEADY_DELTA_THRESHOLD) {
    return {
      label: 'Held steady',
      detail: 'No major KPI movement',
      status: 'steady',
    };
  }

  const status = getProgressStatus(largestMovement.delta);

  return {
    label: `${largestMovement.label} ${formatPointDelta(largestMovement.delta)}`,
    detail: getProgressLabel(status),
    status,
  };
}

function getGoalStatus(
  value: number,
  goal: number,
  direction: 'higher' | 'lower' = 'higher',
): Status {
  if (direction === 'lower') {
    if (value <= goal) return 'onTrack';
    if (value <= goal * 1.15) return 'watch';
    return 'needsFocus';
  }

  if (value >= goal) return 'onTrack';
  if (value >= goal * 0.9) return 'watch';
  return 'needsFocus';
}

function getStatusLabel(status: Status) {
  switch (status) {
    case 'onTrack':
      return 'On track';
    case 'watch':
      return 'Watch';
    default:
      return 'Needs focus';
  }
}

function getStatusClasses(status: Status) {
  switch (status) {
    case 'onTrack':
      return {
        card: 'border-kpi-green/50 bg-[#E5F9D7] text-cosmo-black shadow-[5px_6px_0_0_rgba(41,137,42,0.18)]',
        pill: 'bg-kpi-green text-cosmo-white',
        bar: 'bg-kpi-green',
        soft: 'bg-[#E5F9D7] text-cosmo-black',
      };
    case 'watch':
      return {
        card: 'border-kpi-yellow/70 bg-[#F9E8A5] text-cosmo-black shadow-[5px_6px_0_0_rgba(232,195,73,0.24)]',
        pill: 'bg-kpi-yellow text-cosmo-black',
        bar: 'bg-kpi-yellow',
        soft: 'bg-[#F9E8A5] text-cosmo-black',
      };
    default:
      return {
        card: 'border-kpi-red/50 bg-[#FCCFCD] text-cosmo-black shadow-[5px_6px_0_0_rgba(179,38,30,0.18)]',
        pill: 'bg-kpi-red text-cosmo-white',
        bar: 'bg-kpi-red',
        soft: 'bg-[#FCCFCD] text-cosmo-black',
      };
  }
}

function getNewsletterCellColor(value: number, goal: number) {
  const percent = normalizePercent(value);
  const status = getGoalStatus(percent, goal);

  switch (status) {
    case 'onTrack':
      return '#29892A';
    case 'watch':
      return '#E8C349';
    default:
      return '#B3261E';
  }
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getNewsletterRows(week: StoredWeek) {
  return [...week.employees].sort((a, b) => {
    const gamesDifference = Number(b.totalGames) - Number(a.totalGames);
    if (gamesDifference !== 0) return gamesDifference;
    return String(a.name).localeCompare(String(b.name));
  });
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function fillTextCentered(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, x + width / 2, y + height / 2);
}

function createNewsletterKpiCanvas(week: StoredWeek) {
  const rows = getNewsletterRows(week);
  const scale = 2;
  const padding = 54;
  const columnWidths = [300, 210, 220, 210, 270, 210];
  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const headerHeight = 70;
  const rowHeight = 58;
  const titleHeight = 82;
  const footerHeight = 54;
  const width = tableWidth + padding * 2;
  const height = padding * 2 + titleHeight + headerHeight + rows.length * rowHeight + footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create export canvas.');
  }

  context.scale(scale, scale);
  context.clearRect(0, 0, width, height);

  context.fillStyle = '#F5F6FA';
  context.fillRect(0, 0, width, height);

  context.shadowColor = 'rgba(0, 0, 0, 0.16)';
  context.shadowBlur = 18;
  context.shadowOffsetY = 9;
  drawRoundedRect(
    context,
    padding - 10,
    padding - 10,
    tableWidth + 20,
    height - padding * 2 - footerHeight + 20,
    14,
  );
  context.fillStyle = '#FFFFFF';
  context.fill();
  context.shadowColor = 'transparent';
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;

  context.fillStyle = '#000000';
  context.font = '900 34px Tenon, "DM Sans", Arial, sans-serif';
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.fillText('Store KPI Performance', padding, padding + 30);

  context.fillStyle = '#5E5E5E';
  context.font = '700 19px "DM Sans", Arial, sans-serif';
  context.fillText(
    `${week.storeName} · ${week.weekLabel} · Use as a snapshot for team celebration and coaching follow-up`,
    padding,
    padding + 60,
  );

  const headers = [
    'Team Member',
    '# of Games',
    '# of Guests',
    'Replay %',
    'Review Ask %',
    'Preview %',
  ];

  let currentX = padding;
  const tableTop = padding + titleHeight;

  context.font = '800 30px Tenon, "DM Sans", Arial, sans-serif';
  context.fillStyle = '#FFFFFF';

  headers.forEach((header, index) => {
    const columnWidth = columnWidths[index];
    context.fillStyle = index === 0 ? '#FB2D61' : '#2E69FF';
    context.fillRect(currentX, tableTop, columnWidth, headerHeight);
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.strokeRect(currentX, tableTop, columnWidth, headerHeight);
    context.fillStyle = '#FFFFFF';
    fillTextCentered(context, header, currentX, tableTop, columnWidth, headerHeight);
    currentX += columnWidth;
  });

  rows.forEach((employee, rowIndex) => {
    const y = tableTop + headerHeight + rowIndex * rowHeight;
    const hasGames = Number(employee.totalGames) > 0 || Number(employee.guests) > 0;
    const values = [
      getFirstName(String(employee.name)),
      hasGames ? formatNumber(Number(employee.totalGames)) : '-',
      hasGames ? formatNumber(Number(employee.guests)) : '-',
      hasGames
        ? formatNewsletterPercent(normalizePercent(Number(employee.replaysSoldPercent)))
        : '-',
      hasGames
        ? formatNewsletterPercent(normalizePercent(Number(employee.reviewsAskedPercent)))
        : '-',
      hasGames ? formatNewsletterPercent(normalizePercent(Number(employee.previewsPercent))) : '-',
    ];

    currentX = padding;

    values.forEach((value, columnIndex) => {
      const columnWidth = columnWidths[columnIndex];

      if (columnIndex === 0) {
        context.fillStyle = '#8E47FF';
      } else if (columnIndex === 1 || columnIndex === 2) {
        context.fillStyle = rowIndex % 2 === 0 ? '#FFFFFF' : '#E5E5E5';
      } else if (!hasGames) {
        context.fillStyle = '#E5E5E5';
      } else if (columnIndex === 3) {
        context.fillStyle = getNewsletterCellColor(
          Number(employee.replaysSoldPercent),
          KPI_GOALS.replayPercent,
        );
      } else if (columnIndex === 4) {
        context.fillStyle = getNewsletterCellColor(
          Number(employee.reviewsAskedPercent),
          KPI_GOALS.reviewsAskedPercent,
        );
      } else {
        context.fillStyle = getNewsletterCellColor(
          Number(employee.previewsPercent),
          KPI_GOALS.previewsPercent,
        );
      }

      context.fillRect(currentX, y, columnWidth, rowHeight);
      context.strokeStyle = columnIndex === 0 ? 'rgba(255,255,255,0.45)' : '#B6B6B6';
      context.lineWidth = 2;
      context.strokeRect(currentX, y, columnWidth, rowHeight);

      context.font =
        columnIndex === 0
          ? '800 28px Tenon, "DM Sans", Arial, sans-serif'
          : '800 27px "DM Sans", Arial, sans-serif';
      context.fillStyle = columnIndex === 0 ? '#FFFFFF' : '#000000';

      if (columnIndex >= 3 && hasGames) {
        context.fillStyle = '#FFFFFF';
        context.shadowColor = 'rgba(0,0,0,0.12)';
        context.shadowBlur = 2;
        context.shadowOffsetY = 1;
      }

      fillTextCentered(context, value, currentX, y, columnWidth, rowHeight);
      context.shadowColor = 'transparent';
      context.shadowBlur = 0;
      context.shadowOffsetY = 0;
      currentX += columnWidth;
    });
  });

  context.font = '700 20px "DM Sans", Arial, sans-serif';
  context.fillStyle = '#2B2B2B';
  context.textAlign = 'right';
  context.textBaseline = 'middle';
  context.fillText(
    `Goals: Replay ${KPI_GOALS.replayPercent}% · Review Ask ${KPI_GOALS.reviewsAskedPercent}% · Preview ${KPI_GOALS.previewsPercent}%`,
    padding + tableWidth,
    height - padding + 18,
  );

  return canvas;
}

function exportWeekForNewsletter(week: StoredWeek) {
  const canvas = createNewsletterKpiCanvas(week);
  const link = document.createElement('a');
  link.download = `flnl-page-8-kpi-${slugify(week.storeName)}-${week.weekStart}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function KpiMetricCard({ metric }: { metric: KpiCard }) {
  const status = getGoalStatus(metric.value, metric.goal, metric.direction);
  const classes = getStatusClasses(status);
  const progress = metric.goal ? Math.min((metric.value / metric.goal) * 100, 100) : 0;

  return (
    <article className={`rounded-[28px] border-2 p-5 ${classes.card}`}>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='font-tag text-sm font-black uppercase opacity-75'>{metric.label}</p>
          <p className='font-display mt-2 text-4xl font-black'>{formatPercent(metric.value)}</p>
        </div>
        <span className={`font-tag rounded-full px-3 py-1 text-xs font-black ${classes.pill}`}>
          {getStatusLabel(status)}
        </span>
      </div>

      <div className='mt-5 h-3 overflow-hidden rounded-full border border-cosmo-black/10 bg-cosmo-white/80'>
        <div className={`h-full rounded-full ${classes.bar}`} style={{ width: `${progress}%` }} />
      </div>

      <p className='mt-4 text-sm font-medium leading-6 opacity-80'>{metric.detail}</p>
      <p className='mt-3 font-tag text-xs font-black uppercase opacity-70'>
        Goal: {formatPercent(metric.goal)}
      </p>
    </article>
  );
}

function WeekProgressSection({
  selectedWeek,
  previousWeek,
  metrics,
}: {
  selectedWeek: StoredWeek;
  previousWeek: StoredWeek | null;
  metrics: WeekProgressMetric[];
}) {
  const progressSummary = previousWeek ? getProgressSummary(metrics) : null;
  const strongestGainStatus = progressSummary?.strongestGain
    ? getProgressStatus(progressSummary.strongestGain.delta)
    : null;
  const priorityStatus = progressSummary?.priorityFollowUp
    ? getProgressStatus(progressSummary.priorityFollowUp.delta)
    : null;

  return (
    <section className='teg-panel overflow-hidden text-cosmo-black'>
      <div className='flex flex-col gap-4 border-b-2 border-cosmo-black/10 bg-comic-fog p-5 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <p className='font-tag text-sm font-black uppercase text-primary-web-red'>
            Week-to-week progress
          </p>
          <h2 className='font-heading mt-2 text-2xl font-black'>
            {previousWeek
              ? `${selectedWeek.weekLabel} vs ${previousWeek.weekLabel}`
              : 'Build the next weekly comparison'}
          </h2>
          <p className='mt-1 max-w-3xl text-sm font-medium leading-6 text-ink-soft'>
            {previousWeek
              ? `A compact readout for ${selectedWeek.storeName} movement across the saved KPI reports.`
              : `Add another saved week for ${selectedWeek.storeName} to see progress.`}
          </p>
        </div>

        {previousWeek && progressSummary ? (
          <div className='grid grid-cols-3 gap-2 text-center sm:min-w-[360px]'>
            <div className='rounded-[18px] bg-cosmo-white p-3'>
              <p className='font-display text-2xl font-black text-kpi-green'>
                {progressSummary.improvedCount}
              </p>
              <p className='font-tag text-[11px] font-black uppercase text-ink-soft'>Improved</p>
            </div>
            <div className='rounded-[18px] bg-cosmo-white p-3'>
              <p className='font-display text-2xl font-black text-[#7A5A00]'>
                {progressSummary.steadyCount}
              </p>
              <p className='font-tag text-[11px] font-black uppercase text-ink-soft'>Steady</p>
            </div>
            <div className='rounded-[18px] bg-cosmo-white p-3'>
              <p className='font-display text-2xl font-black text-kpi-red'>
                {progressSummary.needsFollowUpCount}
              </p>
              <p className='font-tag text-[11px] font-black uppercase text-ink-soft'>Follow-up</p>
            </div>
          </div>
        ) : null}
      </div>

      {previousWeek ? (
        <div className='grid gap-5 p-5 xl:grid-cols-[0.72fr_1.28fr]'>
          <div className='rounded-[24px] bg-cosmo-black p-5 text-cosmo-white shadow-[6px_7px_0_0_rgba(0,0,0,0.14)]'>
            <p className='font-tag text-sm font-black uppercase text-cosmo-white/70'>
              Quick read
            </p>
            <p className='font-display mt-3 text-4xl font-black'>
              {progressSummary?.improvedCount ?? 0} of {metrics.length}
            </p>
            <p className='mt-2 text-sm font-semibold leading-6 text-cosmo-white/80'>
              store KPIs improved compared with the prior saved week.
            </p>

            <div className='mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1'>
              <div className='rounded-[18px] bg-cosmo-white/10 p-4'>
                <p className='font-tag text-xs font-black uppercase text-cosmo-white/60'>
                  Strongest gain
                </p>
                <p className='mt-1 font-heading text-lg font-black'>
                  {progressSummary?.strongestGain?.label ?? 'No gain yet'}
                </p>
                <p
                  className={`font-tag mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                    strongestGainStatus
                      ? getProgressClasses(strongestGainStatus).pill
                      : 'bg-cosmo-white text-cosmo-black'
                  }`}>
                  {progressSummary?.strongestGain
                    ? formatPointDelta(progressSummary.strongestGain.delta)
                    : '0.0 pts'}
                </p>
              </div>

              <div className='rounded-[18px] bg-cosmo-white/10 p-4'>
                <p className='font-tag text-xs font-black uppercase text-cosmo-white/60'>
                  Priority follow-up
                </p>
                <p className='mt-1 font-heading text-lg font-black'>
                  {progressSummary?.priorityFollowUp?.label ?? 'No follow-up yet'}
                </p>
                <p
                  className={`font-tag mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                    priorityStatus
                      ? getProgressClasses(priorityStatus).pill
                      : 'bg-cosmo-white text-cosmo-black'
                  }`}>
                  {progressSummary?.priorityFollowUp
                    ? formatPointDelta(progressSummary.priorityFollowUp.delta)
                    : '0.0 pts'}
                </p>
              </div>
            </div>
          </div>

          <div className='overflow-x-auto rounded-[24px] border-2 border-cosmo-black/10'>
            <table className='w-full min-w-[740px] border-collapse text-left text-sm'>
              <thead className='font-tag bg-blue text-xs uppercase text-cosmo-white'>
                <tr>
                  <th className='px-4 py-3 font-black'>KPI</th>
                  <th className='px-4 py-3 font-black'>This week</th>
                  <th className='px-4 py-3 font-black'>Prior</th>
                  <th className='px-4 py-3 font-black'>Change</th>
                  <th className='px-4 py-3 font-black'>Goal</th>
                </tr>
              </thead>
              <tbody className='divide-y-2 divide-cosmo-black/5 bg-cosmo-white'>
                {metrics.map((metric) => {
                  const status = getProgressStatus(metric.delta);
                  const classes = getProgressClasses(status);

                  return (
                    <tr key={metric.label}>
                      <td className='px-4 py-4'>
                        <p className='font-heading text-base font-black text-cosmo-black'>
                          {metric.label}
                        </p>
                        <p className='mt-1 text-xs font-semibold leading-5 text-ink-soft'>
                          {metric.detail}
                        </p>
                      </td>
                      <td className='px-4 py-4 font-display text-xl font-black text-cosmo-black'>
                        {formatPercent(metric.value)}
                      </td>
                      <td className='px-4 py-4 font-display text-xl font-black text-cosmo-black'>
                        {formatPercent(metric.previousValue)}
                      </td>
                      <td className='px-4 py-4'>
                        <span
                          className={`font-tag inline-flex rounded-full px-3 py-1 text-xs font-black ${classes.pill}`}>
                          {formatPointDelta(metric.delta)}
                        </span>
                        <p className='mt-2 text-xs font-black text-ink-soft'>
                          {getProgressLabel(status)}
                        </p>
                      </td>
                      <td className='px-4 py-4 font-black text-cosmo-black'>
                        {formatPercent(metric.goal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className='p-5'>
          <div className='rounded-[24px] border-2 border-dashed border-cosmo-black/20 bg-cosmo-white p-6'>
            <p className='font-heading text-xl font-black text-cosmo-black'>No prior week yet</p>
            <p className='mt-2 max-w-2xl text-sm font-medium leading-6 text-ink-soft'>
              Add another saved week for this store to see progress.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function SmallStatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className='rounded-[28px] bg-cosmo-black p-5 text-cosmo-white shadow-[6px_7px_0_0_rgba(0,0,0,0.16)]'>
      <p className='font-tag text-sm font-black uppercase text-cosmo-white/70'>{label}</p>
      <p className='font-display mt-2 text-3xl font-black'>{value}</p>
      <p className='mt-2 text-sm font-medium leading-6 text-cosmo-white/70'>{detail}</p>
    </article>
  );
}

function EmployeeSpotlight({
  label,
  employee,
  metric,
  count,
}: {
  label: string;
  employee?: EmployeeKpiRow;
  metric: keyof EmployeeKpiRow;
  count: keyof EmployeeKpiRow;
}) {
  const value = employee ? normalizePercent(Number(employee[metric])) : 0;
  const countValue = employee ? Number(employee[count]) : 0;

  return (
    <article className='rounded-[28px] border-2 border-cosmo-black/10 bg-cosmo-white p-5 shadow-[6px_7px_0_0_rgba(0,0,0,0.10)]'>
      <p className='font-tag text-sm font-black uppercase text-primary-web-red'>{label}</p>
      <p className='font-heading mt-3 truncate text-2xl font-black text-cosmo-black'>
        {employee?.name ?? 'No qualifying data'}
      </p>
      <div className='mt-4 flex items-end justify-between gap-3'>
        <p className='font-display text-4xl font-black text-cosmo-black'>{formatPercent(value)}</p>
        <p className='pb-1 text-sm font-semibold text-ink-soft'>{formatNumber(countValue)} total</p>
      </div>
      <p className='mt-3 text-sm font-medium leading-6 text-ink-soft'>
        Use this as a positive example to recognize and repeat.
      </p>
    </article>
  );
}

function EmployeePercentCell({
  value,
  goal,
}: {
  value: number;
  goal: number;
}) {
  const percent = normalizePercent(value);
  const status = getGoalStatus(percent, goal);
  const classes = getStatusClasses(status);
  const progress = goal ? Math.min((percent / goal) * 100, 100) : 0;

  return (
    <div className='min-w-32'>
      <div className='flex items-center justify-between gap-3'>
        <span className='font-display font-black text-cosmo-black'>{formatPercent(percent)}</span>
        <span
          className={`font-tag rounded-full px-2 py-0.5 text-[11px] font-black ${classes.soft}`}>
          {getStatusLabel(status)}
        </span>
      </div>
      <div className='mt-2 h-2 overflow-hidden rounded-full bg-comic-fog'>
        <div className={`h-full rounded-full ${classes.bar}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function EmployeeProgressCell({
  employee,
  previousEmployee,
  hasPreviousWeek,
}: {
  employee: EmployeeKpiRow;
  previousEmployee?: EmployeeKpiRow;
  hasPreviousWeek: boolean;
}) {
  const summary = getEmployeeProgressSummary(employee, previousEmployee, hasPreviousWeek);
  const classes = summary.status ? getProgressClasses(summary.status) : null;

  return (
    <div className='min-w-36'>
      <span
        className={`font-tag inline-flex rounded-full px-3 py-1 text-xs font-black ${
          classes ? classes.pill : 'bg-comic-fog text-ink-soft'
        }`}>
        {summary.label}
      </span>
      <p className={`mt-2 text-xs font-black ${classes ? classes.text : 'text-ink-soft'}`}>
        {summary.detail}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const storage = useSyncExternalStore(subscribeToStorage, getStorageSnapshot, () => EMPTY_STORAGE);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('replaysSoldPercent');

  const selectedWeek = useMemo(() => {
    const activeWeekId = selectedWeekId || storage.latestWeekId || storage.weeks[0]?.id || '';
    return storage.weeks.find((week) => week.id === activeWeekId) ?? storage.weeks[0] ?? null;
  }, [selectedWeekId, storage.latestWeekId, storage.weeks]);

  const previousWeek = useMemo(() => {
    if (!selectedWeek) return null;
    return findPreviousWeekForStore(storage.weeks, selectedWeek);
  }, [selectedWeek, storage.weeks]);

  const weekProgressMetrics = useMemo(() => {
    if (!selectedWeek || !previousWeek) return [];
    return buildWeekProgressMetrics(selectedWeek, previousWeek);
  }, [previousWeek, selectedWeek]);

  const previousEmployeeByKey = useMemo(() => {
    const employeesByKey = new Map<string, EmployeeKpiRow>();

    if (!previousWeek) {
      return employeesByKey;
    }

    previousWeek.employees.forEach((employee) => {
      employeesByKey.set(getEmployeeComparisonKey(employee), employee);
    });

    return employeesByKey;
  }, [previousWeek]);

  const dashboardMetrics = useMemo<KpiCard[]>(() => {
    if (!selectedWeek) return [];

    const { totals } = selectedWeek;
    const rates = getStoreKpiRates(selectedWeek);

    return [
      {
        label: 'Replay conversion',
        value: rates.replayPercent,
        goal: KPI_GOALS.replayPercent,
        detail: `${formatNumber(totals.replaysSold)} replays sold from ${formatNumber(totals.guests)} guests served.`,
        direction: 'higher',
      },
      {
        label: 'Review ask rate',
        value: rates.reviewsAskedPercent,
        goal: KPI_GOALS.reviewsAskedPercent,
        detail: `${formatNumber(totals.reviewsAsked)} review asks across ${formatNumber(totals.totalGames)} games.`,
        direction: 'higher',
      },
      {
        label: 'Shared replay rate',
        value: rates.sharedReplayPercent,
        goal: KPI_GOALS.sharedReplayPercent,
        detail: `${formatNumber(totals.sharedReplay)} shared replay moments across ${formatNumber(totals.totalGames)} games.`,
        direction: 'higher',
      },
      {
        label: 'Preview ask rate',
        value: rates.previewsPercent,
        goal: KPI_GOALS.previewsPercent,
        detail: `${formatNumber(totals.afterGamePreviews)} previews shared across ${formatNumber(totals.totalGames)} games.`,
        direction: 'higher',
      },
    ];
  }, [selectedWeek]);

  const rankedEmployees = useMemo(() => {
    if (!selectedWeek) return [];

    return [...selectedWeek.employees]
      .filter((employee) => Number(employee.totalGames) >= MINIMUM_GAMES_FOR_RANKING)
      .sort((a, b) => {
        if (sortKey === 'name') {
          return String(a.name).localeCompare(String(b.name));
        }

        const aValue = Number(a[sortKey]);
        const bValue = Number(b[sortKey]);
        return bValue - aValue;
      });
  }, [selectedWeek, sortKey]);

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return rankedEmployees.filter((employee) => {
      if (!term) return true;

      return [employee.name, employee.role, employee.storeName]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [rankedEmployees, searchTerm]);

  const topReplay = rankedEmployees
    .filter((employee) => Number(employee.guests) > 0)
    .sort((a, b) => Number(b.replaysSoldPercent) - Number(a.replaysSoldPercent))[0];

  const topReviewAsk = rankedEmployees
    .filter((employee) => Number(employee.totalGames) > 0)
    .sort((a, b) => Number(b.reviewsAskedPercent) - Number(a.reviewsAskedPercent))[0];

  const topPreview = rankedEmployees
    .filter((employee) => Number(employee.totalGames) > 0)
    .sort((a, b) => Number(b.previewsPercent) - Number(a.previewsPercent))[0];

  if (!selectedWeek) {
    return (
      <main className='flex min-h-dvh items-center justify-center bg-off-white px-5 py-10 text-cosmo-black'>
        <section className='teg-panel w-full max-w-2xl p-8 text-center'>
          <div className='font-display mx-auto mb-6 flex size-16 items-center justify-center rounded-[22px] bg-primary-web-red text-3xl font-black text-cosmo-white shadow-[4px_5px_0_0_var(--primary-web-red-dark)]'>
            ↑
          </div>
          <h1 className='font-heading text-4xl font-black'>No KPI data yet</h1>
          <p className='mx-auto mt-4 max-w-xl text-lg font-medium leading-8 text-ink-soft'>
            Upload a cOSmo employee KPI export first. Once a report is saved locally, this dashboard
            will organize the team performance by week.
          </p>
          <Link href='/' className='teg-button mt-8 text-sm'>
            Upload CSV
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className='min-h-dvh bg-off-white px-5 py-6 text-cosmo-black sm:px-8 lg:px-14'>
      <section className='mx-auto w-full max-w-[1440px] space-y-8'>
        <div className='flex items-center justify-between gap-4'>
          <Link
            href='/'
            className='font-heading text-xl font-black text-cosmo-black focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-web-red/30'>
            cOSmo KPI
          </Link>
          <Link href='/' className='teg-button-secondary text-sm'>
            Upload another CSV
          </Link>
        </div>

        <header className='rounded-[32px] bg-primary-web-red p-6 text-cosmo-white shadow-[8px_9px_0_0_var(--primary-web-red-dark)] lg:flex lg:items-end lg:justify-between lg:gap-8 lg:p-8'>
          <div>
            <div className='font-tag mb-4 inline-flex rounded-full bg-cosmo-white px-4 py-2 text-sm font-black uppercase text-primary-web-red'>
              {selectedWeek.storeName} leadership snapshot
            </div>
            <h1 className='font-display text-4xl font-black leading-none sm:text-5xl lg:text-6xl'>
              Weekly KPI coaching dashboard
            </h1>
            <p className='mt-4 max-w-3xl text-base font-medium leading-7 text-cosmo-white/90'>
              Viewing {selectedWeek.weekLabel}. Use this data to celebrate strong examples, identify
              coaching opportunities, and prepare a clear FLNL-ready performance snapshot.
            </p>
          </div>

          <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-end lg:mt-0'>
            <label className='block'>
              <span className='font-tag mb-2 block text-xs font-black uppercase text-cosmo-white/80'>
                Report week
              </span>
              <select
                value={selectedWeek.id}
                onChange={(event) => setSelectedWeekId(event.target.value)}
                className='h-12 min-w-64 rounded-full border-2 border-cosmo-black bg-cosmo-white px-4 text-sm font-black text-cosmo-black outline-none transition focus-visible:ring-4 focus-visible:ring-cosmo-white/40'>
                {storage.weeks.map((week) => (
                  <option key={week.id} value={week.id}>
                    {week.weekLabel} · {week.storeName}
                  </option>
                ))}
              </select>
            </label>

            <button
              type='button'
              onClick={() => exportWeekForNewsletter(selectedWeek)}
              className='teg-button-secondary text-sm'>
              Export selected week
            </button>
          </div>
        </header>

        <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <SmallStatCard
            label='Team members'
            value={formatNumber(selectedWeek.totals.employees)}
            detail='Included in this uploaded report'
          />
          <SmallStatCard
            label='Games hosted'
            value={formatNumber(selectedWeek.totals.totalGames)}
            detail='Total games connected to this week'
          />
          <SmallStatCard
            label='Guests served'
            value={formatNumber(selectedWeek.totals.guests)}
            detail='Guest volume represented in the KPI rows'
          />
          <SmallStatCard
            label='Source file'
            value={new Date(selectedWeek.uploadedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
            detail={selectedWeek.fileName}
          />
        </section>

        <section className='grid gap-4 lg:grid-cols-4'>
          {dashboardMetrics.map((metric) => (
            <KpiMetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <WeekProgressSection
          selectedWeek={selectedWeek}
          previousWeek={previousWeek}
          metrics={weekProgressMetrics}
        />

        <section>
          <div className='mb-4'>
            <p className='font-tag text-sm font-black uppercase text-primary-web-red'>
              Recognition prompts
            </p>
            <h2 className='font-heading mt-2 text-2xl font-black'>Team member spotlights</h2>
            <p className='mt-1 text-sm font-medium leading-6 text-ink-soft'>
              Use these to celebrate specific behaviors, not just percentages.
            </p>
          </div>
          <div className='grid gap-4 lg:grid-cols-3'>
            <EmployeeSpotlight
              label='Replay spotlight'
              employee={topReplay}
              metric='replaysSoldPercent'
              count='replaysSold'
            />
            <EmployeeSpotlight
              label='Review ask spotlight'
              employee={topReviewAsk}
              metric='reviewsAskedPercent'
              count='reviewsAsked'
            />
            <EmployeeSpotlight
              label='Preview spotlight'
              employee={topPreview}
              metric='previewsPercent'
              count='afterGamePreviews'
            />
          </div>
        </section>

        <section className='teg-panel overflow-hidden text-cosmo-black'>
          <div className='flex flex-col gap-4 border-b-2 border-cosmo-black/10 bg-comic-fog p-5 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <p className='font-tag text-sm font-black uppercase text-primary-web-red'>
                Coaching view
              </p>
              <h2 className='font-heading mt-2 text-2xl font-black'>Team member KPI table</h2>
              <p className='mt-1 text-sm font-medium text-ink-soft'>
                Ranking includes team members with at least {MINIMUM_GAMES_FOR_RANKING} games so
                follow-up stays fair and useful.
              </p>
            </div>

            <div className='flex flex-col gap-3 sm:flex-row'>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder='Search team members...'
                className='teg-field h-12 px-4 text-sm font-bold outline-none sm:w-64'
              />
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className='teg-field h-12 px-4 text-sm font-bold outline-none'>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort by {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full min-w-[1140px] border-collapse text-left text-sm'>
              <thead className='font-tag bg-blue text-xs uppercase text-cosmo-white'>
                <tr>
                  <th className='px-5 py-4 font-black'>Team member</th>
                  <th className='px-5 py-4 font-black'>Role</th>
                  <th className='px-5 py-4 font-black'>Games</th>
                  <th className='px-5 py-4 font-black'>Guests</th>
                  <th className='px-5 py-4 font-black'>Week change</th>
                  <th className='px-5 py-4 font-black'>Replay</th>
                  <th className='px-5 py-4 font-black'>Review ask</th>
                  <th className='px-5 py-4 font-black'>Shared replay</th>
                  <th className='px-5 py-4 font-black'>Preview</th>
                </tr>
              </thead>
              <tbody className='divide-y-2 divide-cosmo-black/5'>
                {filteredEmployees.map((employee, index) => {
                  const previousEmployee = previousEmployeeByKey.get(
                    getEmployeeComparisonKey(employee),
                  );

                  return (
                    <tr
                      key={`${employee.name}-${index}`}
                      className='transition hover:bg-comic-fog'>
                      <td className='px-5 py-4'>
                        <div className='flex items-center gap-3'>
                          <div className='flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-primary-web-red text-sm font-black text-cosmo-white shadow-[3px_4px_0_0_var(--primary-web-red-dark)]'>
                            {index + 1}
                          </div>
                          <div>
                            <p className='font-black text-cosmo-black'>{employee.name}</p>
                            <p className='text-xs font-semibold text-ink-soft'>
                              {employee.storeName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-5 py-4 font-medium text-ink-soft'>
                        {employee.role || 'Team member'}
                      </td>
                      <td className='px-5 py-4 font-black text-cosmo-black'>
                        {formatNumber(Number(employee.totalGames))}
                      </td>
                      <td className='px-5 py-4 font-black text-cosmo-black'>
                        {formatNumber(Number(employee.guests))}
                      </td>
                      <td className='px-5 py-4'>
                        <EmployeeProgressCell
                          employee={employee}
                          previousEmployee={previousEmployee}
                          hasPreviousWeek={Boolean(previousWeek)}
                        />
                      </td>
                      <td className='px-5 py-4'>
                        <EmployeePercentCell
                          value={Number(employee.replaysSoldPercent)}
                          goal={KPI_GOALS.replayPercent}
                        />
                        <p className='mt-1 text-xs font-semibold text-ink-soft'>
                          {formatNumber(Number(employee.replaysSold))} sold
                        </p>
                      </td>
                      <td className='px-5 py-4'>
                        <EmployeePercentCell
                          value={Number(employee.reviewsAskedPercent)}
                          goal={KPI_GOALS.reviewsAskedPercent}
                        />
                        <p className='mt-1 text-xs font-semibold text-ink-soft'>
                          {formatNumber(Number(employee.reviewsAsked))} asks
                        </p>
                      </td>
                      <td className='px-5 py-4'>
                        <EmployeePercentCell
                          value={Number(employee.sharedReplayPercent)}
                          goal={KPI_GOALS.sharedReplayPercent}
                        />
                        <p className='mt-1 text-xs font-semibold text-ink-soft'>
                          {formatNumber(Number(employee.sharedReplay))} shared
                        </p>
                      </td>
                      <td className='px-5 py-4'>
                        <EmployeePercentCell
                          value={Number(employee.previewsPercent)}
                          goal={KPI_GOALS.previewsPercent}
                        />
                        <p className='mt-1 text-xs font-semibold text-ink-soft'>
                          {formatNumber(Number(employee.afterGamePreviews))} previews
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!filteredEmployees.length ? (
            <div className='p-8 text-center font-semibold text-ink-soft'>
              No team members match the current search or ranking filters.
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
