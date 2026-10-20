import { test, expect } from '@playwright/test';
import { addCard, createBoard } from './helpers';

test.describe('Board', () => {
  test('creates a board in one click and saves a card', async ({ page }) => {
    await createBoard(page);

    await expect(page.locator('.column-title')).toHaveText([/^To Do/, /^In Progress/, /^Done/]);
    await addCard(page, 'My first test card');

    const viewer = await page.context().newPage();
    await viewer.goto(page.url());
    await expect(viewer.locator('.card').getByText('My first test card')).toBeVisible();
  });

  test('voting settings persist and sync to another page', async ({ page }) => {
    await createBoard(page, { settings: { voting: 'true' } });

    await page.getByRole('button', { name: /board settings/i }).click();
    const settings = page.getByRole('dialog', { name: /board settings/i });
    const allowVoting = settings.getByRole('switch', { name: 'Allow voting', exact: true });
    await expect(allowVoting).toHaveAttribute('aria-checked', 'true');
    await allowVoting.click();
    await expect(allowVoting).toHaveAttribute('aria-checked', 'false');
    await expect(settings.getByText('Votes per person', { exact: true })).toHaveCount(0);

    await settings.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(settings).toHaveCount(0);

    const viewer = await page.context().newPage();
    await viewer.goto(page.url());
    await expect(viewer.locator('.column').first()).toBeVisible();
    await viewer.getByRole('button', { name: /board settings/i }).click();
    const remoteVoting = viewer.getByRole('switch', { name: 'Allow voting', exact: true });
    await expect(remoteVoting).toHaveAttribute('aria-checked', 'false');
    await remoteVoting.click();
    await expect(remoteVoting).toHaveAttribute('aria-checked', 'true');

    await page.getByRole('button', { name: /board settings/i }).click();
    await expect(allowVoting).toHaveAttribute('aria-checked', 'true');
  });

  test('renaming a loaded board persists the new title', async ({ page }) => {
    await createBoard(page);

    const titleInput = page.getByLabel('Board title');
    await titleInput.fill('My Test Board');
    await titleInput.press('Tab');
    const viewer = await page.context().newPage();
    await viewer.goto(page.url());
    await expect(viewer.getByLabel('Board title')).toHaveValue('My Test Board');
  });

  test('runs the steps from a retro template with a vote limit, reset, and a poll', async ({ page }) => {
    await createBoard(page, { template: 'Retrospective', settings: { votes: '1' } });
    const steps = page.getByRole('group', { name: 'Steps' });
    const currentStep = steps.locator('[aria-current="step"]');
    const goTo = label => steps.getByRole('button', { name: label, exact: true }).click();
    const viewer = await page.context().newPage();
    await viewer.goto(page.url());
    const remoteStep = viewer.getByRole('group', { name: 'Steps' }).locator('[aria-current="step"]');
    const expectStep = async label => {
      await expect(currentStep).toHaveAccessibleName(label);
      await expect(remoteStep).toHaveAccessibleName(label);
    };

    await expectStep('Add');
    const firstCard = await addCard(page, 'Keep pairing on difficult tasks');
    const secondCard = await addCard(page, 'Improve build times');

    await goTo('Group');
    await expectStep('Group');
    await expect(page.getByRole('button', { name: 'Add Card', exact: true })).toHaveCount(0);
    await goTo('Vote');
    await expectStep('Vote, 1 vote left');

    await firstCard.getByRole('button', { name: 'Upvote', exact: true }).click();
    await expect(firstCard.locator('.vote-count')).toHaveText('1');
    await expect(currentStep).toHaveAccessibleName('Vote, 0 votes left');
    await secondCard.getByRole('button', { name: 'Upvote', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('reached your vote limit');
    await expect(secondCard.locator('.vote-count')).toHaveText('0');

    await page.getByRole('button', { name: 'Board actions', exact: true }).click();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('menuitem', { name: 'Reset all votes', exact: true }).click();
    await expect(firstCard.locator('.vote-count')).toHaveText('0');
    await expect(currentStep).toHaveAccessibleName('Vote, 1 vote left');

    await firstCard.getByRole('button', { name: 'Upvote', exact: true }).click();
    await expect(currentStep).toHaveAccessibleName('Vote, 0 votes left');
    await goTo('Discuss');
    await expectStep('Discuss');
    await goTo('Vote');
    await expectStep('Vote, 0 votes left');
    await expect(firstCard.locator('.vote-count')).toHaveText('1');

    await goTo('Board');
    await expectStep('Board');
    await expect(firstCard.locator('.vote-count')).toHaveText('1');

    await goTo('Poll');
    await expectStep('Poll');
    await page.locator('.poll-voting .star-button').nth(3).click();
    await expect(page.getByText('Your vote has been submitted:', { exact: false })).toContainText('4/5 stars');
    await page.getByRole('button', { name: 'See results', exact: true }).click();
    await expect(page.locator('.average-rating .score-number')).toHaveText('4.0');

    await goTo('Board');
    await expectStep('Board');
    await expect(firstCard.locator('.vote-count')).toHaveText('1');
  });
});
