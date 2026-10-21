import { beforeAll, describe, test, expect } from 'vitest';
import { loadEmojiSearch } from './emojiSearch';

let data;
beforeAll(async () => { data = await loadEmojiSearch(); });

describe('Emojibase search', () => {
  test.each([
    ['telescope', '🔭'],
    ['satellite', '🛰️'],
    ['otter', '🦦'],
    ['accessibility', '🦾'],
    ['melting', '🫠'],
  ])('finds %s beyond the old keyword table', (query, emoji) => {
    expect(data.search(query).map(result => result.emoji)).toContain(emoji);
  });

  test('normalizes case and separators and supports multiple words', () => {
    expect(data.search('  RED_HEART  ')[0].emoji).toBe('❤️');
    expect(data.search('red-heart')).toEqual(data.search('red heart'));
  });

  test('ranks exact matches ahead of prefixes before applying a limit', () => {
    expect(data.search('fire', 1)[0].emoji).toBe('🔥');
    expect(data.search('heart', 1)[0].emoji).toBe('❤️');
    expect(data.search('🦦', 1)[0].emoji).toBe('🦦');
    expect(data.search('zzznonexistent')).toEqual([]);
  });
});
