import { test, expect } from '@playwright/test';

/**
 * Helper: create a board by clicking the "Default" template tile on the
 * dashboard, then wait for the board view to appear. Retries because board
 * creation silently fails until Firebase anonymous auth is ready.
 *
 * (Mirrors the helper in board.spec.js — e2e specs are self-contained.)
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

/** Extract the ?board= id from a URL string. */
function boardIdFromUrl(url) {
  const match = url.match(/[?&]board=([^&]+)/);
  return match ? match[1] : null;
}

test.describe('Board series', () => {
  test('start next board links boards and lets you page back and forth', async ({ page }) => {
    // Auto-accept the confirm() that appears only if a board already has a next link.
    page.on('dialog', dialog => dialog.accept());

    await createBoard(page);
    await expect(page).toHaveURL(/[?&]board=/);

    const firstBoardId = boardIdFromUrl(page.url());
    expect(firstBoardId).toBeTruthy();

    // Board actions menu → Start next board.
    await page.getByRole('button', { name: /board actions/i }).click();

    const startNextBtn = page.getByRole('menuitem', { name: /start next board/i });
    await expect(startNextBtn).toBeVisible();
    await startNextBtn.click();

    // We should navigate to a NEW board with a different id.
    await expect
      .poll(() => boardIdFromUrl(page.url()), { timeout: 15000 })
      .not.toBe(firstBoardId);
    const secondBoardId = boardIdFromUrl(page.url());
    expect(secondBoardId).toBeTruthy();

    // The new board is the successor, so it shows a "Previous" pager control.
    const prevBtn = page.getByRole('button', { name: /previous board in series/i });
    await expect(prevBtn).toBeVisible({ timeout: 10000 });

    // Page back to the first board.
    await prevBtn.click();
    await expect
      .poll(() => boardIdFromUrl(page.url()), { timeout: 15000 })
      .toBe(firstBoardId);

    // The first board is the predecessor, so it shows a "Next" pager control.
    await expect(page.getByRole('button', { name: /next board in series/i })).toBeVisible({ timeout: 10000 });
  });

  test('link to previous board via paste shows the previous pager', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());

    // Create a first board to be the "previous" board, remember its id, then leave it.
    await createBoard(page);
    await expect(page).toHaveURL(/[?&]board=/);
    const previousBoardId = boardIdFromUrl(page.url());
    expect(previousBoardId).toBeTruthy();

    // Create a second, independent board.
    await createBoard(page);
    await expect(page).toHaveURL(/[?&]board=/);
    const currentBoardId = boardIdFromUrl(page.url());
    expect(currentBoardId).not.toBe(previousBoardId);

    // Board actions menu → Link to previous board.
    await page.getByRole('button', { name: /board actions/i }).click();
    await page.getByRole('menuitem', { name: /link to previous board/i }).click();

    // The link modal appears — paste the previous board id and link.
    await expect(page.getByRole('heading', { name: /link to previous board/i })).toBeVisible();
    await page.getByLabel(/paste a board link or id/i).fill(previousBoardId);
    await page.getByRole('button', { name: /link board/i }).click();

    // Back on the current board, the "Previous" pager should now appear.
    await expect(page.getByRole('button', { name: /previous board in series/i })).toBeVisible({ timeout: 10000 });

    // And paging back lands on the previous board.
    await page.getByRole('button', { name: /previous board in series/i }).click();
    await expect
      .poll(() => boardIdFromUrl(page.url()), { timeout: 15000 })
      .toBe(previousBoardId);
  });
});
