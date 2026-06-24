'use client';

import { TEG_CANVAS_COLORS as brand, TEG_CANVAS_FONT as font } from '@/lib/brand';
import { KPI_GOALS } from './constants';
import {
  formatNewsletterPercent,
  formatNumber,
  getFirstName,
  normalizePercent,
  slugify,
} from './formatters';
import { getNewsletterRows } from './metrics';
import type { StoredWeek } from './types';

type EmployeeRow = StoredWeek['employees'][number];

const EXPORT_SCALE = 2;

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

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
) {
  drawRoundedRect(context, x, y, width, height, radius);
  context.fillStyle = fillStyle;
  context.fill();
}

function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string,
  lineWidth = 1,
) {
  drawRoundedRect(context, x, y, width, height, radius);
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.stroke();
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
  context.fillText(text, x + width / 2, y + height / 2, width - 18);
}

function fillTextLeft(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillText(text, x, y, maxWidth);
}

export function getExportStoreLabel(storeName: string) {
  return storeName
    .replace(/^The Escape Game\s*/i, '')
    .replace(/\s*-\s*The Forum Shops/i, '')
    .replace(/\s*-\s*AREA15/i, '')
    .replace(/\s*:\s*The Forum Shops/i, '')
    .replace(/\s*:\s*AREA15/i, '')
    .replace(/:$/, '')
    .trim();
}

function getMetricStatus(percentValue: number, goal: number) {
  const percent = normalizePercent(percentValue);

  if (percent >= goal) {
    return {
      label: 'On goal',
      dot: brand.green,
      background: brand.greenSoft,
      border: 'rgba(41, 137, 42, 0.22)',
    };
  }

  if (percent >= goal * 0.85) {
    return {
      label: 'Watch',
      dot: brand.yellow,
      background: brand.yellowSoft,
      border: 'rgba(184, 145, 22, 0.24)',
    };
  }

  return {
    label: 'Focus',
    dot: brand.danger,
    background: brand.dangerSoft,
    border: 'rgba(179, 38, 30, 0.22)',
  };
}

function getMetricGoal(columnIndex: number) {
  if (columnIndex === 3) return KPI_GOALS.replayPercent;
  if (columnIndex === 4) return KPI_GOALS.reviewsAskedPercent;
  return KPI_GOALS.previewsPercent;
}

function getMetricPercent(employee: EmployeeRow, columnIndex: number) {
  if (columnIndex === 3) return Number(employee.replaysSoldPercent);
  if (columnIndex === 4) return Number(employee.reviewsAskedPercent);
  return Number(employee.previewsPercent);
}

function getFirstNameWithLastInitial(name: string) {
  const nameParts = name.trim().split(/\s+/);
  const firstName = getFirstName(name);
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  if (!lastName) return firstName;

  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}

function getEmployeeValues(employee: EmployeeRow, hasGames: boolean) {
  return [
    getFirstNameWithLastInitial(String(employee.name)),
    hasGames ? formatNumber(Number(employee.totalGames)) : '-',
    hasGames ? formatNumber(Number(employee.guests)) : '-',
    hasGames ? formatNewsletterPercent(normalizePercent(Number(employee.replaysSoldPercent))) : '-',
    hasGames
      ? formatNewsletterPercent(normalizePercent(Number(employee.reviewsAskedPercent)))
      : '-',
    hasGames ? formatNewsletterPercent(normalizePercent(Number(employee.previewsPercent))) : '-',
  ];
}

function drawMetricValue(
  context: CanvasRenderingContext2D,
  value: string,
  employee: EmployeeRow,
  columnIndex: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const status = getMetricStatus(
    getMetricPercent(employee, columnIndex),
    getMetricGoal(columnIndex),
  );
  const chipWidth = Math.min(width - 24, Math.max(96, value.length * 13 + 58));
  const chipHeight = 34;
  const chipX = x + (width - chipWidth) / 2;
  const chipY = y + (height - chipHeight) / 2;

  fillRoundedRect(context, chipX, chipY, chipWidth, chipHeight, 17, status.background);
  strokeRoundedRect(context, chipX, chipY, chipWidth, chipHeight, 17, status.border, 1.5);

  context.beginPath();
  context.arc(chipX + 20, chipY + chipHeight / 2, 5, 0, Math.PI * 2);
  context.fillStyle = status.dot;
  context.fill();

  context.fillStyle = brand.black;
  context.font = `900 20px ${font.body}`;
  fillTextCentered(context, value, chipX + 20, chipY, chipWidth - 20, chipHeight);
}

import { isManagementRole } from './roles';

export { isManagementRole };

export function getFrontlineNewsletterRows(week: StoredWeek) {
  return getNewsletterRows(week).filter((employee) => !isManagementRole(employee.role));
}

export function prepareNewsletterExport(week: StoredWeek) {
  const storeLabel = getExportStoreLabel(week.storeName || 'Store') || 'Store';
  const storeSlug = slugify(storeLabel || 'store');

  return {
    columns: ['Team Member', '# Games', '# Guests', 'Replay', 'Review Ask', 'Preview'],
    filename: `flnl-kpi-${storeSlug}-${week.weekStart}.png`,
    rows: getFrontlineNewsletterRows(week),
    storeLabel,
    storeSlug,
    weekLabel: week.weekLabel,
    weekStart: week.weekStart,
  };
}

function drawHeader(
  context: CanvasRenderingContext2D,
  week: StoredWeek,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const storeLabel = getExportStoreLabel(week.storeName || 'Store') || 'Store';

  fillRoundedRect(context, x, y, width, height, 28, brand.surface);
  strokeRoundedRect(context, x, y, width, height, 28, brand.line, 1.5);

  context.fillStyle = brand.red;
  context.font = `900 18px ${font.body}`;
  fillTextLeft(context, 'FRONTLINE KPI SNAPSHOT', x + 30, y + 36, width - 60);

  context.fillStyle = brand.black;
  context.font = `900 44px ${font.heading}`;
  fillTextLeft(context, `${storeLabel} Performance`, x + 30, y + 78, width - 360);

  context.fillStyle = brand.muted;
  context.font = `800 18px ${font.body}`;
  fillTextLeft(
    context,
    '',
    x + 30,
    y + 116,
    width - 360,
  );

  const weekPillWidth = 280;
  const weekPillHeight = 58;
  const weekPillX = x + width - weekPillWidth - 30;
  const weekPillY = y + 36;

  fillRoundedRect(context, weekPillX, weekPillY, weekPillWidth, weekPillHeight, 20, brand.redSoft);
  strokeRoundedRect(
    context,
    weekPillX,
    weekPillY,
    weekPillWidth,
    weekPillHeight,
    20,
    'rgba(251, 45, 97, 0.18)',
  );

  context.fillStyle = brand.red;
  context.font = `900 14px ${font.body}`;
  fillTextLeft(context, 'REPORT WEEK', weekPillX + 20, weekPillY + 19, weekPillWidth - 40);

  context.fillStyle = brand.black;
  context.font = `900 22px ${font.body}`;
  fillTextLeft(context, week.weekLabel, weekPillX + 20, weekPillY + 40, weekPillWidth - 40);
}

function drawGoalStrip(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  fillRoundedRect(context, x, y, width, height, 22, brand.red);

  context.fillStyle = brand.surface;
  context.font = `900 18px ${font.body}`;
  fillTextLeft(context, '', x + 24, y + height / 2, 240);

  context.font = `800 17px ${font.body}`;
  context.textAlign = 'right';
  context.textBaseline = 'middle';
  context.fillText(
    `Goals: Replay ${KPI_GOALS.replayPercent}%  •  Review Ask ${KPI_GOALS.reviewsAskedPercent}%  •  Preview ${KPI_GOALS.previewsPercent}%`,
    x + width - 24,
    y + height / 2,
    width - 300,
  );
}

function drawTableHeader(
  context: CanvasRenderingContext2D,
  headers: string[],
  columnWidths: number[],
  x: number,
  y: number,
  height: number,
) {
  let currentX = x;

  headers.forEach((header, index) => {
    const columnWidth = columnWidths[index];
    const isFirstColumn = index === 0;

    context.fillStyle = brand.background;
    context.fillRect(currentX, y, columnWidth, height);

    context.fillStyle = brand.ink;
    context.font = `900 17px ${font.body}`;

    if (isFirstColumn) {
      fillTextLeft(context, header, currentX + 22, y + height / 2, columnWidth - 36);
    } else {
      fillTextCentered(context, header, currentX, y, columnWidth, height);
    }

    currentX += columnWidth;
  });
}

function drawEmptyRow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  context.fillStyle = brand.surface;
  context.fillRect(x, y, width, height);

  context.fillStyle = brand.muted;
  context.font = `800 20px ${font.body}`;
  fillTextCentered(context, 'No frontline KPI rows found for this week.', x, y, width, height);
}

function drawEmployeeRow(
  context: CanvasRenderingContext2D,
  employee: EmployeeRow,
  rowIndex: number,
  columnWidths: number[],
  x: number,
  y: number,
  height: number,
) {
  const hasGames = Number(employee.totalGames) > 0 || Number(employee.guests) > 0;
  const values = getEmployeeValues(employee, hasGames);
  let currentX = x;

  values.forEach((value, columnIndex) => {
    const columnWidth = columnWidths[columnIndex];
    const isNameColumn = columnIndex === 0;
    const isMetricColumn = columnIndex >= 3;

    context.fillStyle = rowIndex % 2 === 0 ? brand.surface : brand.rowAlt;
    context.fillRect(currentX, y, columnWidth, height);

    context.strokeStyle = brand.line;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(currentX, y + height);
    context.lineTo(currentX + columnWidth, y + height);
    context.stroke();

    if (isNameColumn) {
      context.fillStyle = brand.black;
      context.font = `900 23px ${font.heading}`;
      fillTextLeft(context, value, currentX + 22, y + height / 2, columnWidth - 34);
    } else if (!hasGames) {
      context.fillStyle = brand.muted;
      context.font = `800 20px ${font.body}`;
      fillTextCentered(context, value, currentX, y, columnWidth, height);
    } else if (isMetricColumn) {
      drawMetricValue(context, value, employee, columnIndex, currentX, y, columnWidth, height);
    } else {
      context.fillStyle = brand.ink;
      context.font = `900 22px ${font.body}`;
      fillTextCentered(context, value, currentX, y, columnWidth, height);
    }

    currentX += columnWidth;
  });
}

function createNewsletterKpiCanvas(week: StoredWeek) {
  const { rows } = prepareNewsletterExport(week);

  const pagePadding = 46;
  const cardPadding = 30;
  const columnWidths = [286, 140, 150, 172, 196, 172];
  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  const headerBlockHeight = 150;
  const goalStripHeight = 54;
  const tableHeaderHeight = 50;
  const rowHeight = 56;
  const tableRowsHeight = Math.max(rows.length, 1) * rowHeight;
  const tableHeight = tableHeaderHeight + tableRowsHeight;
  const verticalGap = 16;

  const cardWidth = tableWidth + cardPadding * 2;
  const cardHeight =
    cardPadding * 2 + headerBlockHeight + verticalGap + goalStripHeight + verticalGap + tableHeight;

  const width = cardWidth + pagePadding * 2;
  const height = cardHeight + pagePadding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width * EXPORT_SCALE;
  canvas.height = height * EXPORT_SCALE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create export canvas.');
  }

  context.scale(EXPORT_SCALE, EXPORT_SCALE);
  context.clearRect(0, 0, width, height);

  context.fillStyle = brand.background;
  context.fillRect(0, 0, width, height);

  const cardX = pagePadding;
  const cardY = pagePadding;
  const contentX = cardX + cardPadding;
  let currentY = cardY + cardPadding;

  fillRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 32, brand.surface);
  strokeRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 32, brand.line, 1.5);

  drawHeader(context, week, contentX, currentY, tableWidth, headerBlockHeight);
  currentY += headerBlockHeight + verticalGap;

  drawGoalStrip(context, contentX, currentY, tableWidth, goalStripHeight);
  currentY += goalStripHeight + verticalGap;

  const tableX = contentX;
  const tableY = currentY;
  const headers = ['Team Member', '# Games', '# Guests', 'Replay', 'Review Ask', 'Preview'];

  context.save();
  drawRoundedRect(context, tableX, tableY, tableWidth, tableHeight, 24);
  context.clip();

  drawTableHeader(context, headers, columnWidths, tableX, tableY, tableHeaderHeight);

  if (rows.length === 0) {
    drawEmptyRow(context, tableX, tableY + tableHeaderHeight, tableWidth, rowHeight);
  } else {
    rows.forEach((employee, rowIndex) => {
      drawEmployeeRow(
        context,
        employee,
        rowIndex,
        columnWidths,
        tableX,
        tableY + tableHeaderHeight + rowIndex * rowHeight,
        rowHeight,
      );
    });
  }

  context.restore();
  strokeRoundedRect(context, tableX, tableY, tableWidth, tableHeight, 24, brand.line, 1.5);

  return canvas;
}

export function exportWeekForNewsletter(week: StoredWeek) {
  const canvas = createNewsletterKpiCanvas(week);
  const link = document.createElement('a');
  const { filename } = prepareNewsletterExport(week);

  link.download = filename;
  link.href = canvas.toDataURL('image/png');

  document.body.appendChild(link);
  link.click();
  link.remove();
}
