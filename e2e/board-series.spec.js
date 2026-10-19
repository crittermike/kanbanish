import { test, expect } from '@playwright/test';
import { addCard, createBoard } from './helpers';

test.describe('Board series', () => {
  test('start next board links boards and lets you page back and forth', async ({ page }) => {
    await createBoard(page);
    const firstBoardUrl = page.url();
    const firstBoardId = new URL(firstBoardUrl).searchParams.get('board');
    await addCard(page, 'A commitment from the previous board');

    // Board actions menu → Start next board.
    await page.getByRole('button', { name: /board actions/i }).click();

    const startNextBtn = page.getByRole('menuitem', { name: /start next board/i });
    await expect(startNextBtn).toBeVisible();
    await startNextBtn.click();

    // We should navigate to a NEW board with a different id.
    await expect(page).toHaveURL(url => {
      const boardId = url.searchParams.get('board');
      return !!boardId && boardId !== firstBoardId;
    });
    const secondBoardUrl = page.url();

    // The new board is the successor, so it shows a "Previous" pager control.
    const prevBtn = page.getByRole('button', { name: /previous board in series/i });
    await expect(prevBtn).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.column-title')).toHaveText([/^To Do/, /^In Progress/, /^Done/]);
    await expect(page.locator('.card')).toHaveCount(0);

    // Page back to the first board.
    await prevBtn.click();
    await expect(page).toHaveURL(firstBoardUrl);
    await expect(page.getByText('A commitment from the previous board', { exact: true })).toBeVisible();

    // The first board is the predecessor, so it shows a "Next" pager control.
    await expect(page.getByRole('button', { name: /next board in series/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /next board in series/i }).click();
    await expect(page).toHaveURL(secondBoardUrl);
    await expect(page.locator('.column-title')).toHaveText([/^To Do/, /^In Progress/, /^Done/]);
    await expect(page.locator('.card')).toHaveCount(0);
  });

  test('link to previous board via paste shows the previous pager', async ({ page }) => {
    // Create a first board to be the "previous" board, remember its id, then leave it.
    await createBoard(page);
    await expect(page).toHaveURL(/[?&]board=/);
    const previousBoardUrl = page.url();
    const previousBoardId = new URL(previousBoardUrl).searchParams.get('board');

    // Create a second, independent board.
    await createBoard(page);
    await expect(page).toHaveURL(/[?&]board=/);
    const currentBoardId = new URL(page.url()).searchParams.get('board');
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
    await expect(page).toHaveURL(previousBoardUrl);
  });
});
