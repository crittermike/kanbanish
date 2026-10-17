import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('shows quick-create links and opens and closes the template picker', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Kanbanish' })).toBeVisible();

    // Quick-create template tiles link to bookmarkable ?template= URLs
    await expect(page.getByRole('link', { name: 'Default' })).toHaveAttribute('href', '?template=default');
    await expect(page.getByRole('link', { name: 'Retrospective' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'All templates' })).toBeVisible();

    await expect(page.getByLabel('Board ID or URL')).toBeVisible();

    await page.getByRole('button', { name: 'All templates' }).click();
    await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
    await expect(page.getByPlaceholder('Search templates')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('link', { name: /lean coffee/i })).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('filters templates and creates a board from the picker', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'All templates' }).click();
    await page.getByPlaceholder('Search templates').fill('lean coffee');
    const templates = page.getByRole('dialog').getByRole('link');
    await expect(templates).toHaveCount(1);
    await templates.click();

    await expect(page).toHaveURL(/[?&]board=[^&]+/);
    await expect(page.locator('.column-title')).toHaveText([/^Topics/, /^Discussing/, /^Done/]);
  });
});
