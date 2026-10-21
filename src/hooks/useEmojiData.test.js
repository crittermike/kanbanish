import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { loadEmojiSearch } from '../utils/emojiSearch';
import useEmojiData from './useEmojiData';

vi.mock('../utils/emojiSearch', () => ({
  getLoadedEmojiSearch: () => null,
  loadEmojiSearch: vi.fn(),
}));

beforeEach(() => vi.resetAllMocks());

test('does not load data until emoji search is used, then updates when ready', async () => {
  let resolve;
  loadEmojiSearch.mockReturnValue(new Promise(done => { resolve = done; }));
  const { result, rerender } = renderHook(enabled => useEmojiData(enabled), { initialProps: false });
  expect(loadEmojiSearch).not.toHaveBeenCalled();
  rerender(true);
  expect(result.current.loading).toBe(true);
  const data = { search: vi.fn() };
  await act(async () => resolve(data));
  expect(result.current.data).toBe(data);
  expect(result.current.loading).toBe(false);
});

test('exposes failures instead of treating an unavailable index as no matches', async () => {
  const error = new Error('Offline');
  loadEmojiSearch.mockRejectedValueOnce(error);
  const { result } = renderHook(() => useEmojiData(true));
  await waitFor(() => expect(result.current.error).toBe(error));
  expect(result.current.loading).toBe(false);
  expect(result.current.data).toBeNull();
});
