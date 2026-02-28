import { test, expect } from '@playwright/test';

/**
 * Helper: create a board via the template modal UI flow.
 * Waits for auth, clicks New Board, selects default template, clicks Create Board,
 * then waits for the board view to appear.
 */
async function createBoardViaModal(page) {
  await page.goto('/');

  // Wait for the dashboard to be fully loaded
  await expect(page.getByRole('button', { name: /new board/i })).toBeVisible();

  // Wait for Firebase auth — the app needs an authenticated user before board creation works.
  // We poll by checking if clicking "New Board" and "Create Board" results in navigation.
  // Strategy: click through the modal flow, and if the board doesn't appear,
  // the auth wasn't ready. Use a retry loop.
  let boardLoaded = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    // Click "New Board" to open the template modal
    await page.getByRole('button', { name: /new board/i }).click();

    // Wait for the modal to appear
    const modalHeading = page.getByRole('heading', { name: /choose a board template/i });
    await expect(modalHeading).toBeVisible({ timeout: 3000 });

    // The default template should already be selected — click "Create Board"
    await page.getByRole('button', { name: /create board/i }).click();

    // Wait to see if we navigate to the board view
    try {
      await expect(page.getByLabel('Board title')).toBeVisible({ timeout: 8000 });
      boardLoaded = true;
      break;
    } catch {
      // Auth wasn't ready yet — the modal's handleTemplateSelected silently returned.
      // Wait a bit for auth to complete and try again.
      // Close the modal if it's still open
      const cancelBtn = page.getByRole('button', { name: /cancel/i });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
      }
      await page.waitForTimeout(3000);
    }
  }

  if (!boardLoaded) {
    throw new Error('Failed to create board after 5 attempts — Firebase auth may not be working');
  }
}

test.describe('Board', () => {
  test('can create a board via template modal and see columns', async ({ page }) => {
    await createBoardViaModal(page);

    // URL should now contain ?board= parameter
    await expect(page).toHaveURL(/[?&]board=/);

    // Default template has 3 columns: To Do, In Progress, Done
    await expect(page.locator('.column')).toHaveCount(3, { timeout: 10000 });
  });

  test('can add a card to a column', async ({ page }) => {
    await createBoardViaModal(page);

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
    await createBoardViaModal(page);

    // Open settings
    await page.getByRole('button', { name: /board settings/i }).click();

    // Settings modal should appear
    await expect(page.getByRole('heading', { name: /board settings/i })).toBeVisible();

    // Should show Appearance section
    await expect(page.getByText('Appearance')).toBeVisible();

    // Close via the close button
    await page.getByRole('button', { name: /close/i }).click();

    // Settings should be gone
    await expect(page.getByRole('heading', { name: /board settings/i })).not.toBeVisible();
  });

  test('can rename the board title', async ({ page }) => {
    await createBoardViaModal(page);

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
