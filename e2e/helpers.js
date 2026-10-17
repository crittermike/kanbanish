import { expect } from '@playwright/test';

export async function createBoard(page, { template = 'Default', settings = {} } = {}) {
  const query = new URLSearchParams(settings).toString();
  await page.goto(query ? `/?${query}` : '/');
  await page.getByRole('link', { name: template, exact: true }).click();
  await expect(page).toHaveURL(/[?&]board=[^&]+/);
  // The header renders before Firebase loads; a column confirms the saved board is ready.
  await expect(page.locator('.column').first()).toBeVisible();
}

export async function addCard(page, content) {
  const column = page.locator('.column').first();
  await column.getByRole('button', { name: 'Add Card', exact: true }).click();
  await column.getByRole('textbox', { name: 'Card content' }).fill(content);
  await column.getByRole('button', { name: 'Add', exact: true }).click();
  const card = column.locator('.card').filter({ hasText: content });
  await expect(card).toBeVisible();
  return card;
}
