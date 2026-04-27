'use client';

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

const brand = {
  offWhite: '#F5F6FA',
  white: '#FFFFFF',
  red: '#FB2D61',
  berry: '#890E40',
  black: '#000000',
  graphite: '#2B2B2B',
  grey: '#6E6E6E',
  fog: '#E5E5E5',
  lightFog: '#EEF1F6',
  green: '#29892A',
  yellow: '#E8C349',
  danger: '#B3261E',
} as const;

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
  lineWidth = 2,
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

function drawSolidShadow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  offsetX = 7,
  offsetY = 8,
) {
  fillRoundedRect(context, x + offsetX, y + offsetY, width, height, radius, 'rgba(0, 0, 0, 0.12)');
}

function getExportStoreLabel(storeName: string) {
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
      fill: brand.green,
      text: brand.white,
    };
  }

  if (percent >= goal * 0.85) {
    return {
      label: 'Watch',
      fill: brand.yellow,
      text: brand.black,
    };
  }

  return {
    label: 'Focus',
    fill: brand.danger,
    text: brand.white,
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
  const lastName = nameParts.length > 1 ? nameParts.at(-1) : '';

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

function drawMetricPill(
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
  const pillWidth = Math.min(width - 34, Math.max(108, value.length * 18 + 34));
  const pillHeight = 34;
  const pillX = x + (width - pillWidth) / 2;
  const pillY = y + (height - pillHeight) / 2;

  fillRoundedRect(context, pillX, pillY, pillWidth, pillHeight, 17, status.fill);

  context.fillStyle = status.text;
  context.font = '900 20px "DM Sans", Arial, sans-serif';
  fillTextCentered(context, value, pillX, pillY, pillWidth, pillHeight);
}

function isManagementRole(role: string | number | undefined) {
  const normalizedRole = String(role ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const managementRoles = new Set([
    'manager',
    'management',
    'general manager',
    'assistant manager',
    'gm',
    'gmit',
    'am',
    'amit',
  ]);

  if (managementRoles.has(normalizedRole)) return true;

  return (
    normalizedRole.includes('general manager') ||
    normalizedRole.includes('assistant manager') ||
    normalizedRole.includes('manager in training') ||
    normalizedRole.includes('management')
  );
}

function getFrontlineNewsletterRows(week: StoredWeek) {
  return getNewsletterRows(week).filter((employee) => !isManagementRole(employee.role));
}

function createNewsletterKpiCanvas(week: StoredWeek) {
  const rows = getFrontlineNewsletterRows(week);

  const padding = 56;
  const cardPadding = 34;
  const columnWidths = [310, 190, 200, 210, 250, 210];
  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  const headerBlockHeight = 128;
  const metaHeight = 52;
  const headerHeight = 58;
  const rowHeight = 58;
  const tableHeight = headerHeight + rows.length * rowHeight;
  const footerHeight = 52;
  const gap = 22;

  const cardWidth = tableWidth + cardPadding * 2;
  const cardHeight =
    cardPadding * 2 + headerBlockHeight + metaHeight + gap + tableHeight + gap + footerHeight;

  const width = cardWidth + padding * 2;
  const height = cardHeight + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width * EXPORT_SCALE;
  canvas.height = height * EXPORT_SCALE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create export canvas.');
  }

  context.scale(EXPORT_SCALE, EXPORT_SCALE);
  context.clearRect(0, 0, width, height);

  context.fillStyle = brand.offWhite;
  context.fillRect(0, 0, width, height);

  const cardX = padding;
  const cardY = padding;
  const contentX = cardX + cardPadding;
  let currentY = cardY + cardPadding;

  drawSolidShadow(context, cardX, cardY, cardWidth, cardHeight, 32);
  fillRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 32, brand.white);
  strokeRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 32, 'rgba(0, 0, 0, 0.12)', 2);

  fillRoundedRect(context, contentX, currentY, tableWidth, headerBlockHeight, 28, brand.red);

  const storeLabel = getExportStoreLabel(week.storeName || 'Store') || 'Store';

  context.fillStyle = brand.white;
  context.font = '900 20px "DM Sans", Arial, sans-serif';
  fillTextLeft(context, 'FRONTLINE NEWSLETTER', contentX + 30, currentY + 34, tableWidth - 60);

  context.font = '900 48px Tenon, "DM Sans", Arial, sans-serif';
  fillTextLeft(context, 'Store KPI Performance', contentX + 30, currentY + 78, tableWidth - 60);

  context.font = '800 22px "DM Sans", Arial, sans-serif';
  context.fillStyle = 'rgba(255, 255, 255, 0.86)';
  context.textAlign = 'right';
  context.textBaseline = 'middle';
  context.fillText(storeLabel, contentX + tableWidth - 30, currentY + 36, 360);

  currentY += headerBlockHeight + gap;

  fillRoundedRect(context, contentX, currentY, tableWidth, metaHeight, 24, brand.offWhite);
  strokeRoundedRect(
    context,
    contentX,
    currentY,
    tableWidth,
    metaHeight,
    24,
    'rgba(0, 0, 0, 0.10)',
    1.5,
  );

  context.fillStyle = brand.grey;
  context.font = '900 16px "DM Sans", Arial, sans-serif';
  fillTextLeft(context, 'REPORT WEEK', contentX + 24, currentY + metaHeight / 2, 220);

  context.fillStyle = brand.black;
  context.font = '900 22px "DM Sans", Arial, sans-serif';
  context.textAlign = 'right';
  context.fillText(week.weekLabel, contentX + tableWidth - 24, currentY + metaHeight / 2);

  currentY += metaHeight + gap;

  const headers = ['Team Member', '# Games', '# Guests', 'Replay', 'Review Ask', 'Preview'];

  const tableX = contentX;
  const tableY = currentY;
  const tableRadius = 24;

  context.save();
  drawRoundedRect(context, tableX, tableY, tableWidth, tableHeight, tableRadius);
  context.clip();

  context.fillStyle = brand.black;
  context.fillRect(tableX, tableY, tableWidth, headerHeight);

  let currentX = tableX;

  headers.forEach((header, index) => {
    const columnWidth = columnWidths[index];

    context.fillStyle = brand.white;
    context.font = '900 21px Tenon, "DM Sans", Arial, sans-serif';
    fillTextCentered(context, header, currentX, tableY, columnWidth, headerHeight);

    if (index > 0) {
      context.strokeStyle = 'rgba(255, 255, 255, 0.20)';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(currentX, tableY);
      context.lineTo(currentX, tableY + tableHeight);
      context.stroke();
    }

    currentX += columnWidth;
  });

  rows.forEach((employee, rowIndex) => {
    const y = tableY + headerHeight + rowIndex * rowHeight;
    const hasGames = Number(employee.totalGames) > 0 || Number(employee.guests) > 0;
    const values = getEmployeeValues(employee, hasGames);

    currentX = tableX;

    values.forEach((value, columnIndex) => {
      const columnWidth = columnWidths[columnIndex];
      const isNameColumn = columnIndex === 0;
      const isMetricColumn = columnIndex >= 3;

      context.fillStyle = rowIndex % 2 === 0 ? brand.white : '#FAFBFD';
      context.fillRect(currentX, y, columnWidth, rowHeight);

      context.strokeStyle = brand.fog;
      context.lineWidth = 2;
      context.strokeRect(currentX, y, columnWidth, rowHeight);

      if (isNameColumn) {
        context.fillStyle = brand.black;
        context.font = '900 25px Tenon, "DM Sans", Arial, sans-serif';
        fillTextLeft(context, value, currentX + 24, y + rowHeight / 2, columnWidth - 38);
      } else if (!hasGames) {
        context.fillStyle = brand.grey;
        context.font = '800 22px "DM Sans", Arial, sans-serif';
        fillTextCentered(context, value, currentX, y, columnWidth, rowHeight);
      } else if (isMetricColumn) {
        drawMetricPill(context, value, employee, columnIndex, currentX, y, columnWidth, rowHeight);
      } else {
        context.fillStyle = brand.graphite;
        context.font = '800 24px "DM Sans", Arial, sans-serif';
        fillTextCentered(context, value, currentX, y, columnWidth, rowHeight);
      }

      currentX += columnWidth;
    });
  });

  context.restore();

  strokeRoundedRect(
    context,
    tableX,
    tableY,
    tableWidth,
    tableHeight,
    tableRadius,
    'rgba(0, 0, 0, 0.14)',
    2,
  );

  const footerY = tableY + tableHeight + gap;

  fillRoundedRect(context, contentX, footerY, tableWidth, footerHeight, 24, brand.lightFog);

  context.fillStyle = brand.grey;
  context.font = '800 17px "DM Sans", Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(
    `Goals: Replay ${KPI_GOALS.replayPercent}%  •  Review Ask ${KPI_GOALS.reviewsAskedPercent}%  •  Preview ${KPI_GOALS.previewsPercent}%`,
    contentX + tableWidth / 2,
    footerY + footerHeight / 2,
    tableWidth - 40,
  );

  return canvas;
}

export function exportWeekForNewsletter(week: StoredWeek) {
  const canvas = createNewsletterKpiCanvas(week);
  const link = document.createElement('a');
  const storeSlug = slugify(getExportStoreLabel(week.storeName || 'store') || 'store');

  link.download = `flnl-kpi-${storeSlug}-${week.weekStart}.png`;
  link.href = canvas.toDataURL('image/png');

  document.body.appendChild(link);
  link.click();
  link.remove();
}
