import { test, expect } from '@playwright/test';

/**
 * Helper: create a board by clicking the "Default" template tile on the
 * dashboard, then wait for the board view to appear. Retries because board
 * creation silently fails until Firebase anonymous auth is ready.
 */
async function createBoard(page) {
  await page.goto('/');

  const defaultChip = page.getByRole('link', { name: 'Default' });
  await expect(defaultChip).toBeVisible();

  let boardLoaded = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    await defaultChip.click();

    try {
      await expect(page.getByLabel('Board title')).toBeVisible({ timeout: 8000 });
      boardLoaded = true;
      break;
    } catch {
      await page.waitForTimeout(3000);
    }
  }

  if (!boardLoaded) {
    throw new Error('Failed to create board after 5 attempts — Firebase auth may not be working');
  }
}

test.describe('Board', () => {
  test('can create a board from a template tile and see columns', async ({ page }) => {
    await createBoard(page);

    // URL should now contain ?board= parameter
    await expect(page).toHaveURL(/[?&]board=/);

    // Default template has 3 columns: To Do, In Progress, Done
    await expect(page.locator('.column')).toHaveCount(3, { timeout: 10000 });
  });

  test('can add a card to a column', async ({ page }) => {
    await createBoard(page);

    // Click "Add Card" on the first column
    const firstColumn = page.locator('.column').first();
    await firstColumn.getByRole('button', { name: /add card/i }).click();

    // Should show the inline card form with a textarea
    const textarea = firstColumn.locator('textarea');
    await expect(textarea).toBeVisible();

    // Type card content and submit
    await textarea.fill('My first test card');

    // Click Add to save
    await firstColumn.getByRole('button', { name: 'Add' }).click();

    // The card should now appear in the column (target the card element, not the textarea)
    await expect(firstColumn.locator('.card').getByText('My first test card')).toBeVisible({ timeout: 5000 });
  });

  test('can open and close board settings', async ({ page }) => {
    await createBoard(page);

    // Open settings
    await page.getByRole('button', { name: /board settings/i }).click();

    // Settings modal should appear
    await expect(page.getByRole('heading', { name: /board settings/i })).toBeVisible();

    // Should show the voting preferences
    await expect(page.getByRole('region', { name: /^voting$/i })).toBeVisible();

    // Close via the close button
    await page.getByRole('button', { name: /close/i }).click();

    // Settings should be gone
    await expect(page.getByRole('heading', { name: /board settings/i })).not.toBeVisible();
  });

  test('can rename the board title', async ({ page }) => {
    await createBoard(page);

    const titleInput = page.getByLabel('Board title');
    await expect(titleInput).toBeVisible();

    // Wait for any pending Firebase syncs to settle before editing
    await page.waitForTimeout(2000);

    // Clear and type a new title
    await titleInput.fill('My Test Board');
    await titleInput.press('Tab');

    // Wait for the Firebase round-trip (write + listener update)
    await expect(titleInput).toHaveValue('My Test Board', { timeout: 10000 });
  });
});
