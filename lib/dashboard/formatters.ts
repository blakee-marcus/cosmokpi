import { STEADY_DELTA_THRESHOLD } from './constants';

const numberFormatter = new Intl.NumberFormat('en-US');

export const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

export function formatNewsletterPercent(value: number) {
  if (!Number.isFinite(value)) return '-';

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.00$/, '').replace(/0$/, '');
}

export function safePercent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return (numerator / denominator) * 100;
}

export function normalizePercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return value <= 1 && value >= 0 ? value * 100 : value;
}

export function formatPointDelta(delta: number) {
  if (!Number.isFinite(delta)) return '0.0 pts';

  const rounded = Math.abs(delta) <= STEADY_DELTA_THRESHOLD ? 0 : Number(delta.toFixed(1));
  const sign = rounded > 0 ? '+' : '';

  return `${sign}${rounded.toFixed(1)} pts`;
}

export function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
