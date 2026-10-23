import { expect } from '@playwright/test';
import { test, addCard, createBoard } from './helpers';

for (const multipleVotes of [false, true]) {
  test(`each person gets three votes on cards and groups, including a new run (multivote=${multipleVotes})`, async ({ page, viewer }, testInfo) => {
    await createBoard(page, {
      settings: { voting: 'true', votes: '3', multivote: String(multipleVotes) }
    });
    const first = await addCard(page, 'Group member one');
    const second = await addCard(page, 'Group member two');
    await addCard(page, 'First independent idea');
    await addCard(page, 'Second independent idea');
    await addCard(page, 'Over budget idea');
    const steps = page.getByRole('group', { name: 'Steps' });
    await steps.getByRole('button', { name: 'Group', exact: true }).click();
    await first.dragTo(second);
    await expect(page.locator('.card-group .card')).toHaveCount(2);
    await steps.getByRole('button', { name: 'Vote', exact: true }).click();
    await viewer.goto(page.url());

    const currentStep = person => person.getByRole('group', { name: 'Steps' }).locator('[aria-current="step"]');
    const targets = person => [
      person.locator('.card-group-header'),
      person.locator('.card').filter({ hasText: 'First independent idea' }),
      person.locator('.card').filter({ hasText: 'Second independent idea' })
    ];
    for (const person of [page, viewer]) {
      await expect(currentStep(person)).toHaveAccessibleName('Vote, 3 votes left');
      for (const [index, target] of targets(person).entries()) {
        await target.getByRole('button', { name: 'Upvote', exact: true }).click();
        await expect(currentStep(person)).toHaveAccessibleName(`Vote, ${2 - index} vote${index === 1 ? '' : 's'} left`);
      }
      const extra = person.locator('.card').filter({ hasText: 'Over budget idea' });
      await extra.getByRole('button', { name: 'Upvote', exact: true }).click();
      await expect(person.getByRole('status')).toContainText('reached your vote limit');
      await expect(extra.locator('.vote-count')).toHaveText('0');
    }
    for (const target of targets(page)) {
      await expect(target.locator('.vote-count')).toHaveText('1');
    }

    await steps.getByRole('button', { name: 'Discuss', exact: true }).click();
    await steps.getByRole('button', { name: 'Vote', exact: true }).click();
    await expect(currentStep(page)).toHaveAccessibleName('Vote, 0 votes left');
    await steps.getByRole('button', { name: 'Board', exact: true }).click();
    await expect(currentStep(page)).toHaveAccessibleName('Board');
    for (const target of targets(page)) {
      await expect(target.locator('.vote-count')).toHaveText('2');
    }
    await page.screenshot({ path: testInfo.outputPath('two-people-six-votes.png') });
    await steps.getByRole('button', { name: 'Vote', exact: true }).click();
    for (const person of [page, viewer]) {
      await expect(currentStep(person)).toHaveAccessibleName('Vote, 3 votes left');
      for (const target of targets(person)) {
        await expect(target.locator('.vote-count')).toHaveText('0');
      }
    }
    await expect(viewer.getByRole('status')).not.toContainText('reached your vote limit');
    await viewer.screenshot({ path: testInfo.outputPath('new-run-three-votes-left.png') });
    for (const person of [page, viewer]) {
      for (const [index, target] of targets(person).entries()) {
        await target.getByRole('button', { name: 'Upvote', exact: true }).click();
        await expect(currentStep(person)).toHaveAccessibleName(`Vote, ${2 - index} vote${index === 1 ? '' : 's'} left`);
      }
    }
    await viewer.reload();
    await expect(currentStep(viewer)).toHaveAccessibleName('Vote, 0 votes left');
    await steps.getByRole('button', { name: 'Board', exact: true }).click();
    await expect(currentStep(page)).toHaveAccessibleName('Board');
    for (const target of targets(page)) {
      await expect(target.locator('.vote-count')).toHaveText('2');
    }
  });
}
