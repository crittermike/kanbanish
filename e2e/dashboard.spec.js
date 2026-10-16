import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('loads the landing page with key elements', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Kanbanish' })).toBeVisible();

    // Quick-create template tiles link to bookmarkable ?template= URLs
    await expect(page.getByRole('link', { name: 'Default' })).toHaveAttribute('href', '?template=default');
    await expect(page.getByRole('link', { name: 'Retrospective' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'All templates' })).toBeVisible();

    await expect(page.getByLabel('Board ID or URL')).toBeVisible();
  });

  test('opens the template picker from All templates', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'All templates' }).click();

    await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
    await expect(page.getByPlaceholder('Search templates')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('link', { name: /lean coffee/i })).toBeVisible();
  });

  test('can close the template picker', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'All templates' }).click();
    await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('heading', { name: 'Templates' })).not.toBeVisible();
  });
});
