'use client';

import { KPI_GOALS } from './constants';
import {
  formatNewsletterPercent,
  formatNumber,
  getFirstName,
  normalizePercent,
  slugify,
} from './formatters';
import { getNewsletterCellColor, getNewsletterRows } from './metrics';
import type { StoredWeek } from './types';

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

function createNewsletterKpiCanvas(week: StoredWeek) {
  const rows = getNewsletterRows(week);
  const scale = 2;

  const brand = {
    offWhite: '#F5F6FA',
    cosmoWhite: '#FFFFFF',
    cosmoBlack: '#111111',
    inkSoft: '#4B4B4B',
    border: 'rgba(17, 17, 17, 0.16)',
    feverishPink: '#FF1E57',
    primaryWebRed: '#FB2D61',
    comicViolet: '#9757FE',
    comicFog: '#EEF0F5',
    rowAlt: '#F8F8FB',
  };

  const padding = 56;
  const cardPadding = 32;
  const tableRadius = 28;

  const columnWidths = [300, 210, 220, 210, 270, 210];
  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  const heroHeight = 142;
  const headerHeight = 66;
  const rowHeight = 60;
  const tableHeight = headerHeight + rows.length * rowHeight;
  const tableGap = 28;
  const footerGap = 26;
  const footerHeight = 54;

  const cardWidth = tableWidth + cardPadding * 2;
  const cardHeight =
    cardPadding * 2 + heroHeight + tableGap + tableHeight + footerGap + footerHeight;

  const width = cardWidth + padding * 2;
  const height = cardHeight + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create export canvas.');
  }

  context.scale(scale, scale);
  context.clearRect(0, 0, width, height);

  context.fillStyle = brand.offWhite;
  context.fillRect(0, 0, width, height);

  const heroGradient = context.createLinearGradient(0, 0, width, 220);
  heroGradient.addColorStop(0, brand.feverishPink);
  heroGradient.addColorStop(0.68, 'rgba(255, 30, 87, 0.86)');
  heroGradient.addColorStop(1, 'rgba(255, 30, 87, 0)');

  context.fillStyle = heroGradient;
  context.fillRect(0, 0, width, 250);

  const cardX = padding;
  const cardY = padding;

  context.fillStyle = brand.cosmoBlack;
  drawRoundedRect(context, cardX + 7, cardY + 8, cardWidth, cardHeight, 32);
  context.fill();

  drawRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 32);
  context.fillStyle = brand.cosmoWhite;
  context.fill();

  context.strokeStyle = brand.cosmoBlack;
  context.lineWidth = 2;
  drawRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 32);
  context.stroke();

  const contentX = cardX + cardPadding;
  let currentY = cardY + cardPadding;

  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';

  const badgeText = getExportStoreLabel(week.storeName || 'Store');

  context.font = '900 34px Tenon, "DM Sans", Arial, sans-serif';
  const badgeWidth = Math.max(190, context.measureText(badgeText).width + 38);

  context.fillStyle = brand.cosmoBlack;
  drawRoundedRect(context, contentX, currentY, badgeWidth, 46, 16);
  context.fill();

  context.fillStyle = brand.cosmoWhite;
  context.font = '900 31px Tenon, "DM Sans", Arial, sans-serif';
  context.fillText(badgeText, contentX + 18, currentY + 33);

  const textX = contentX + badgeWidth + 26;

  context.fillStyle = brand.primaryWebRed;
  context.font = '900 18px "DM Sans", Arial, sans-serif';
  context.fillText('WEEKLY KPI EXPORT', textX, currentY + 22);

  context.fillStyle = brand.cosmoBlack;
  context.font = '900 40px Tenon, "DM Sans", Arial, sans-serif';
  context.fillText('Store KPI Performance', textX, currentY + 62);

  currentY += 96;

  context.fillStyle = brand.comicFog;
  drawRoundedRect(context, contentX, currentY, tableWidth, 42, 21);
  context.fill();

  context.strokeStyle = brand.border;
  context.lineWidth = 1.5;
  drawRoundedRect(context, contentX, currentY, tableWidth, 42, 21);
  context.stroke();

  context.fillStyle = brand.inkSoft;
  context.font = '800 19px "DM Sans", Arial, sans-serif';
  context.fillText(week.weekLabel, contentX + 20, currentY + 28);

  currentY += 42 + tableGap;

  const headers = [
    'Team Member',
    '# of Games',
    '# of Guests',
    'Replay %',
    'Review Ask %',
    'Preview %',
  ];

  const tableX = contentX;
  const tableY = currentY;

  context.save();
  drawRoundedRect(context, tableX, tableY, tableWidth, tableHeight, tableRadius);
  context.clip();

  context.fillStyle = brand.cosmoBlack;
  context.fillRect(tableX, tableY, columnWidths[0], headerHeight);

  context.fillStyle = brand.feverishPink;
  context.fillRect(tableX + columnWidths[0], tableY, tableWidth - columnWidths[0], headerHeight);

  let currentX = tableX;

  headers.forEach((header, index) => {
    const columnWidth = columnWidths[index];

    context.fillStyle = brand.cosmoWhite;
    context.font = '900 24px Tenon, "DM Sans", Arial, sans-serif';
    fillTextCentered(context, header, currentX, tableY, columnWidth, headerHeight);

    if (index > 0) {
      context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
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

    currentX = tableX;

    values.forEach((value, columnIndex) => {
      const columnWidth = columnWidths[columnIndex];
      const isNameColumn = columnIndex === 0;
      const isMetricColumn = columnIndex >= 3;

      if (isNameColumn) {
        context.fillStyle = brand.comicViolet;
      } else if (!hasGames) {
        context.fillStyle = brand.comicFog;
      } else if (isMetricColumn) {
        const goal =
          columnIndex === 3
            ? KPI_GOALS.replayPercent
            : columnIndex === 4
              ? KPI_GOALS.reviewsAskedPercent
              : KPI_GOALS.previewsPercent;

        const percent =
          columnIndex === 3
            ? Number(employee.replaysSoldPercent)
            : columnIndex === 4
              ? Number(employee.reviewsAskedPercent)
              : Number(employee.previewsPercent);

        context.fillStyle = getNewsletterCellColor(percent, goal);
      } else {
        context.fillStyle = rowIndex % 2 === 0 ? brand.cosmoWhite : brand.rowAlt;
      }

      context.fillRect(currentX, y, columnWidth, rowHeight);

      context.strokeStyle = isNameColumn ? 'rgba(255, 255, 255, 0.35)' : 'rgba(17, 17, 17, 0.10)';
      context.lineWidth = 2;
      context.strokeRect(currentX, y, columnWidth, rowHeight);

      context.font = isNameColumn
        ? '900 27px Tenon, "DM Sans", Arial, sans-serif'
        : '800 26px "DM Sans", Arial, sans-serif';

      context.fillStyle =
        isNameColumn || (isMetricColumn && hasGames) ? brand.cosmoWhite : brand.cosmoBlack;

      if (isMetricColumn && hasGames) {
        context.shadowColor = 'rgba(0, 0, 0, 0.18)';
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

  context.restore();

  context.strokeStyle = brand.cosmoBlack;
  context.lineWidth = 2;
  drawRoundedRect(context, tableX, tableY, tableWidth, tableHeight, tableRadius);
  context.stroke();

  const footerY = tableY + tableHeight + footerGap;

  context.fillStyle = brand.cosmoBlack;
  drawRoundedRect(context, contentX + 4, footerY + 5, tableWidth, footerHeight, 24);
  context.fill();

  context.fillStyle = brand.cosmoWhite;
  drawRoundedRect(context, contentX, footerY, tableWidth, footerHeight, 24);
  context.fill();

  context.strokeStyle = brand.cosmoBlack;
  context.lineWidth = 2;
  drawRoundedRect(context, contentX, footerY, tableWidth, footerHeight, 24);
  context.stroke();

  context.fillStyle = brand.cosmoBlack;
  context.font = '900 18px "DM Sans", Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(
    `Goals: Replay ${KPI_GOALS.replayPercent}% · Review Ask ${KPI_GOALS.reviewsAskedPercent}% · Preview ${KPI_GOALS.previewsPercent}%`,
    contentX + tableWidth / 2,
    footerY + footerHeight / 2,
  );

  return canvas;
}

export function exportWeekForNewsletter(week: StoredWeek) {
  const canvas = createNewsletterKpiCanvas(week);
  const link = document.createElement('a');
  link.download = `flnl-kpi-${slugify(week.storeName)}-${week.weekStart}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  link.remove();
}
