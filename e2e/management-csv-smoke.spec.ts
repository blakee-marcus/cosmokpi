import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const fakeManagementCsv = join(
  process.cwd(),
  'test/fixtures/csv/fake-management-week-2026-05-11.csv',
);
const fakeManagementFileName = 'fake-management-week-2026-05-11.csv';
const fakeManagementCsvText = readFileSync(fakeManagementCsv, 'utf8');

test('imports fake management CSV and exercises dashboard review paths', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          (window as Window & { __clipboardProbe?: string }).__clipboardProbe = text;
          return Promise.resolve();
        },
      },
    });
  });

  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await expect(page.getByText('Waiting for CSV')).toBeVisible();

  const dataTransfer = await page.evaluateHandle(
    ({ csvText, fileName }) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([csvText], fileName, { type: 'text/csv' }));
      return transfer;
    },
    { csvText: fakeManagementCsvText, fileName: fakeManagementFileName },
  );

  await page
    .locator('label[aria-label="Upload cOSmo CSV file"]')
    .dispatchEvent('drop', { dataTransfer });

  await expect(page.getByText('Review import before saving')).toBeVisible();
  await expect(page.getByText('Report week chosen', { exact: true })).toBeVisible();
  await expect(page.getByText('Duplicate rows merged')).toBeVisible();
  await page.getByRole('button', { name: 'Save local report' }).click();

  await expect(page.getByText('Report saved successfully')).toBeVisible();
  await expect(page.getByText(fakeManagementFileName)).toBeVisible();
  await expect(page.getByText('Report type: Game Guide')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Review dashboard' })).toBeVisible();

  await page.getByRole('link', { name: 'Review dashboard' }).click();

  await expect(page.getByRole('heading', { name: 'Weekly performance' })).toBeVisible();
  await expect(page.getByText('Training Store North weekly dashboard')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Team performance table' })).toBeVisible();
  await expect(page.getByRole('row', { name: /Alex Arcade/ })).toBeVisible();

  await page.getByRole('button', { name: 'Copy action plan' }).click();
  await expect(page.getByText('Action plan copied.')).toBeVisible();
  const copiedActionPlan = await page.evaluate(
    () => (window as Window & { __clipboardProbe?: string }).__clipboardProbe,
  );
  expect(copiedActionPlan).toContain('This Week’s Team Focus — Training Store North');
  expect(copiedActionPlan).toContain('Huddle note:');
  expect(copiedActionPlan).not.toContain('Selected period');

  await page.getByRole('button', { name: 'Sort team member table' }).click();
  await page.getByRole('option', { name: 'Preview ask rate' }).click();
  await page.getByRole('searchbox', { name: 'Search team members' }).fill('Blair');
  await expect(page.getByRole('row', { name: /Blair Beacon/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Alex Arcade/ })).toHaveCount(0);

  await page.getByRole('button', { name: /Monthly/ }).click();
  await expect(page.getByRole('heading', { name: 'Monthly performance' })).toBeVisible();
  await expect(page.getByText('Viewing June 2026 across 1 saved report.')).toBeVisible();
  await expect(page.getByRole('row', { name: /Alex Arcade/ })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export weekly recap' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(
    /^flnl-kpi-training-store-north-\d{4}-\d{2}-\d{2}\.png$/,
  );
});
