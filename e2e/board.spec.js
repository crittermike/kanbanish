import { expect } from '@playwright/test';
import { test, addCard, createBoard } from './helpers';

test.describe('Board', () => {
  test('creates a board in one click and saves a card', async ({ page, viewer }) => {
    await createBoard(page);

    await expect(page.locator('.column-title')).toHaveText([/^To Do/, /^In Progress/, /^Done/]);
    await addCard(page, 'My first test card');

    await viewer.goto(page.url());
    await expect(viewer.locator('.card').getByText('My first test card')).toBeVisible();
    await viewer.reload();
    await expect(viewer.locator('.card').getByText('My first test card')).toBeVisible();
  });

  test('voting settings persist and sync to another user', async ({ page, viewer }) => {
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

  test('runs collaborative steps with hiding, grouping, vote limits, Discuss, and a poll', async ({ page, viewer }) => {
    await createBoard(page, { template: 'Retrospective', settings: { votes: '1' } });
    const steps = page.getByRole('group', { name: 'Steps' });
    const currentStep = steps.locator('[aria-current="step"]');
    const goTo = label => steps.getByRole('button', { name: label, exact: true }).click();
    await viewer.goto(page.url());
    const remoteStep = viewer.getByRole('group', { name: 'Steps' }).locator('[aria-current="step"]');
    const expectStep = async (label, remoteLabel = label) => {
      await expect(currentStep).toHaveAccessibleName(label);
      await expect(remoteStep).toHaveAccessibleName(remoteLabel);
    };

    await expectStep('Add');
    const firstCard = await addCard(page, 'Keep pairing on difficult tasks');
    const secondCard = await addCard(page, 'Improve build times');
    const ungroupedCard = await addCard(page, 'Keep pull requests small');
    await expect(viewer.getByRole('img', { name: 'Hidden card' })).toHaveCount(3);
    await expect(viewer.getByText('Keep pairing on difficult tasks', { exact: true })).toHaveCount(0);

    await goTo('Group');
    await expectStep('Group');
    await expect(page.getByRole('button', { name: 'Add Card', exact: true })).toHaveCount(0);
    await expect(viewer.getByText('Keep pairing on difficult tasks', { exact: true })).toBeVisible();
    await firstCard.dragTo(secondCard);
    const group = page.locator('.card-group');
    await expect(group.locator('.card')).toHaveCount(2);
    await expect(viewer.locator('.card-group .card')).toHaveCount(2);
    await group.getByRole('textbox', { name: 'Group name' }).fill('Pairing and builds');
    await group.getByRole('textbox', { name: 'Group name' }).press('Enter');
    await expect(viewer.locator('.card-group-name')).toHaveText('Pairing and builds');
    await goTo('Vote');
    await expectStep('Vote, 1 vote left');

    const groupHeader = group.locator('.card-group-header');
    await groupHeader.getByRole('button', { name: 'Upvote', exact: true }).click();
    await expect(groupHeader.locator('.vote-count')).toHaveText('1');
    await expect(currentStep).toHaveAccessibleName('Vote, 0 votes left');
    await ungroupedCard.getByRole('button', { name: 'Upvote', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('reached your vote limit');
    await expect(ungroupedCard.locator('.vote-count')).toHaveText('0');
    await expect(remoteStep).toHaveAccessibleName('Vote, 1 vote left');

    await page.getByRole('button', { name: 'Board actions', exact: true }).click();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('menuitem', { name: 'Reset all votes', exact: true }).click();
    await expect(groupHeader.locator('.vote-count')).toHaveText('0');
    await expect(currentStep).toHaveAccessibleName('Vote, 1 vote left');

    await groupHeader.getByRole('button', { name: 'Upvote', exact: true }).click();
    await expect(currentStep).toHaveAccessibleName('Vote, 0 votes left');
    await goTo('Discuss');
    await expectStep('Discuss');
    await expect(page.locator('.results-view .card-group-name')).toHaveText('Pairing and builds');
    await expect(page.locator('.results-view .card-group-header .vote-count')).toHaveText('1');
    await expect(viewer.locator('.results-view .card-group-header .vote-count')).toHaveText('1');
    await expect(page.locator('.results-counter')).toHaveText('1 / 2');
    await goTo('Vote');
    await expectStep('Vote, 0 votes left', 'Vote, 1 vote left');
    await expect(groupHeader.locator('.vote-count')).toHaveText('1');

    await goTo('Board');
    await expectStep('Board');
    await expect(groupHeader.locator('.vote-count')).toHaveText('1');

    await goTo('Poll');
    await expectStep('Poll');
    await page.locator('.poll-voting .star-button').nth(3).click();
    await expect(page.getByText('Your vote has been submitted:', { exact: false })).toContainText('4/5 stars');
    await page.getByRole('button', { name: 'See results', exact: true }).click();
    await expect(page.locator('.average-rating .score-number')).toHaveText('4.0');

    await goTo('Board');
    await expectStep('Board');
    await expect(groupHeader.locator('.vote-count')).toHaveText('1');

    await goTo('Add');
    await expectStep('Add');
    await expect(viewer.getByText('Keep pull requests small', { exact: true })).toHaveCount(0);
    await addCard(page, 'A new thought in the second run');
    await expect(viewer.getByRole('img', { name: 'Hidden card' })).toHaveCount(4);
    await expect(viewer.getByText('A new thought in the second run', { exact: true })).toHaveCount(0);
    await goTo('Group');
    await expectStep('Group');
    await expect(viewer.getByText('A new thought in the second run', { exact: true })).toBeVisible();
    await expect(group.locator('.card')).toHaveCount(2);
  });

  test('returning to Add keeps other people\'s cards hidden, even with clock skew', async ({ page, viewer }) => {
    // The facilitator's clock runs ahead of the other person's
    await page.addInitScript(() => {
      const now = Date.now;
      Date.now = () => now() + 10 * 60 * 1000;
    });
    await createBoard(page, { template: 'Retrospective' });
    const steps = page.getByRole('group', { name: 'Steps' });
    const currentStep = steps.locator('[aria-current="step"]');
    await viewer.goto(page.url());
    await expect(viewer.locator('.column').first()).toBeVisible();

    await addCard(page, 'Owner first card');
    await addCard(viewer, 'Viewer first card');
    await steps.getByRole('button', { name: 'Group', exact: true }).click();
    await expect(currentStep).toHaveAccessibleName('Group');
    await steps.getByRole('button', { name: 'Board', exact: true }).click();
    await expect(currentStep).toHaveAccessibleName('Board');
    await steps.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(currentStep).toHaveAccessibleName('Add');

    await addCard(page, 'Owner second card');
    await addCard(viewer, 'Viewer second card');
    await expect(page.getByRole('img', { name: 'Hidden card' })).toHaveCount(2);
    await expect(viewer.getByRole('img', { name: 'Hidden card' })).toHaveCount(2);
  });

  test('Big Orca health answers sync between users and survive starting the steps', async ({ page, viewer }) => {
    await page.goto('/?template=big-orca');
    await expect(page).toHaveURL(/[?&]board=[^&]+/);
    const steps = page.getByRole('group', { name: 'Steps' });
    await expect(steps.locator('[aria-current="step"]')).toHaveText('Health');
    const ownRating = page.getByRole('group', { name: 'Teamwork', exact: true }).getByRole('button', { name: /^5\b/ });
    await ownRating.click();
    await expect(ownRating).toHaveAttribute('aria-pressed', 'true');

    await viewer.goto(page.url());
    const remoteRating = viewer.getByRole('group', { name: 'Teamwork', exact: true }).getByRole('button', { name: /^3\b/ });
    await remoteRating.click();
    await expect(remoteRating).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'See results', exact: true }).click();
    await expect(page.getByTestId('health-overall-score')).toHaveText('4.0');
    await expect(page.locator('.health-results-participants')).toHaveText('2');

    await steps.getByRole('button', { name: 'Group', exact: true }).click();
    await expect(page.locator('.column-title').first()).toHaveText(/^Good stuff/);
    await steps.getByRole('button', { name: 'Health', exact: true }).click();
    await expect(ownRating).toHaveAttribute('aria-pressed', 'true');
    await expect(remoteRating).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'See results', exact: true }).click();
    await expect(page.getByTestId('health-overall-score')).toHaveText('4.0');
  });

  test('mobile template URL starts Add and uses the step selector with the default vote budget', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?template=default&retro=true');
    await expect(page.locator('.column').first()).toBeVisible();
    const step = page.getByRole('combobox', { name: 'Step', exact: true });
    await expect(step).toBeVisible();
    await expect(step).toHaveValue('add');
    const card = await addCard(page, 'Mobile discussion item');
    await step.selectOption('vote');
    await expect(step.getByRole('option', { name: 'Vote (5 left)' })).toBeAttached();
    await card.getByRole('button', { name: 'Upvote', exact: true }).click();
    await expect(step.getByRole('option', { name: 'Vote (4 left)' })).toBeAttached();
    await step.selectOption('discuss');
    await expect(page.locator('.results-view')).toContainText('Mobile discussion item');
    await step.selectOption('board');
    await expect(card.locator('.vote-count')).toHaveText('1');
  });
});
