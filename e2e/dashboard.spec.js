import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('loads the landing page with key elements', async ({ page }) => {
    await page.goto('/');

    // Should show the app title
    await expect(page.getByRole('heading', { name: 'Kanbanish' })).toBeVisible();

    // Should show the tagline
    await expect(page.getByText('Collaborative boards for teams')).toBeVisible();

    // Should show the "New Board" button
    await expect(page.getByRole('button', { name: /new board/i })).toBeVisible();

    // Should show the join input
    await expect(page.getByPlaceholder(/paste a board url or id/i)).toBeVisible();

    // Should show feature highlights
    await expect(page.getByText('Instant setup')).toBeVisible();
    await expect(page.getByText('Real-time collaboration')).toBeVisible();
    await expect(page.getByText('No account needed')).toBeVisible();
  });

  test('opens template modal when clicking New Board', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /new board/i }).click();

    // Template modal should appear with the heading
    await expect(page.getByRole('heading', { name: /choose a board template/i })).toBeVisible();

    // Should have a Create Board button
    await expect(page.getByRole('button', { name: /create board/i })).toBeVisible();

    // Should have a Cancel button
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();

    // Should have template search input
    await expect(page.getByPlaceholder(/search templates/i)).toBeVisible();
  });

  test('can close template modal with Cancel', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /new board/i }).click();
    await expect(page.getByRole('heading', { name: /choose a board template/i })).toBeVisible();

    await page.getByRole('button', { name: /cancel/i }).click();

    // Modal should be gone
    await expect(page.getByRole('heading', { name: /choose a board template/i })).not.toBeVisible();
  });
});
