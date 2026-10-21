import { expect } from '@playwright/test';
import { test, createBoard, addCard } from './helpers';

test('loads emoji data only on first use and shares it between autocomplete and reactions', async ({ page }) => {
  const dataRequests = [];
  let releaseData;
  const dataReady = new Promise(resolve => { releaseData = resolve; });
  await page.route(/\/emojiSearchData-[^/]+\.js/, async route => {
    await dataReady;
    await route.continue();
  });
  page.on('request', request => {
    if (/\/emojiSearchData-[^/]+\.js/.test(request.url())) dataRequests.push(request.url());
  });
  await createBoard(page);
  const column = page.locator('.column').first();
  await column.getByRole('button', { name: 'Add Card', exact: true }).click();
  const input = column.getByRole('textbox', { name: 'Card content' });
  await input.fill('Exploring');
  expect(dataRequests).toHaveLength(0);

  await input.fill('Exploring :telescope');
  await expect(page.getByRole('status', { name: 'Emoji suggestions' })).toHaveText('Loading emojis...');
  await page.screenshot({ path: test.info().outputPath('emoji-loading.png') });
  await input.fill('Exploring :otter');
  releaseData();
  await expect(page.getByRole('option', { name: '🦦 :otter:' })).toBeVisible();
  await input.fill('Exploring :telescope');
  const suggestion = page.getByRole('option', { name: '🔭 :telescope:' });
  await expect(suggestion).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('emoji-autocomplete.png') });
  await input.press('Enter');
  await expect(input).toHaveValue('Exploring 🔭');
  await column.getByRole('button', { name: 'Add', exact: true }).click();
  const card = column.locator('.card').filter({ hasText: 'Exploring 🔭' });
  await card.hover();
  await card.getByRole('button', { name: 'Add reaction', exact: true }).click();
  const search = page.getByRole('textbox', { name: 'Search emojis' });
  for (const [query, emoji] of [
    ['telescope', '🔭'],
    ['satellite', '🛰️'],
    ['otter', '🦦'],
    ['accessibility', '🦾'],
  ]) {
    await search.fill(query);
    await expect(page.locator('.emoji-option').filter({ hasText: emoji }).first()).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`emoji-${query}.png`) });
  }
  await search.fill('otter');
  await page.getByRole('button', { name: 'otter', exact: true }).click();
  await expect(card.getByRole('button', { name: /🦦 reaction, 1 reaction, you reacted/ })).toBeVisible();
  expect(dataRequests).toHaveLength(1);
});

test('keeps common reactions usable when emoji search cannot load', async ({ page }) => {
  let requests = 0;
  await page.route(/\/emojiSearchData-[^/]+\.js/, async route => {
    requests += 1;
    if (requests === 1) await route.abort();
    else await route.continue();
  });
  await createBoard(page);
  const card = await addCard(page, 'Search failure');
  await card.hover();
  await card.getByRole('button', { name: 'Add reaction', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Emoji search unavailable');
  await expect(page.locator('.emoji-option').first()).toBeVisible();
  await page.locator('.emoji-option').first().click();
  await expect(card.getByRole('button', { name: /😀 reaction, 1 reaction, you reacted/ })).toBeVisible();
  await card.hover();
  await card.getByRole('button', { name: 'Add reaction', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search emojis' }).fill('otter');
  await expect(page.getByTestId('emoji-no-results')).toHaveCount(0);
  await page.screenshot({ path: test.info().outputPath('emoji-unavailable.png') });
  await page.getByRole('button', { name: 'Reload', exact: true }).click();
  await card.hover();
  await card.getByRole('button', { name: 'Add reaction', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search emojis' }).fill('otter');
  await expect(page.getByRole('button', { name: 'otter', exact: true })).toBeVisible();
});
