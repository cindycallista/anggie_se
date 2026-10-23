import { expect, test } from '@playwright/test';

test('student can add a study-room booking', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your name').fill('Hong Ying Pei');
  await page.locator('#room').selectOption('N305');
  await page.locator('#start').fill('14:00');
  await page.locator('#purpose').fill('E2E practice');
  await page.getByRole('button', { name: 'Add booking' }).click();

  await expect(page.getByRole('status')).toHaveText('Booking added.');
  await expect(page.getByRole('cell', { name: 'Hong Ying Pei' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'E2E practice' })).toBeVisible();
});
