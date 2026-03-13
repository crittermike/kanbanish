import { describe, test, expect } from 'vitest';
import { searchEmojiShortcodes } from './emojiShortcodes';

describe('searchEmojiShortcodes', () => {
  test('returns empty array for empty query', () => {
    expect(searchEmojiShortcodes('')).toEqual([]);
  });

  test('returns empty array for null/undefined query', () => {
    expect(searchEmojiShortcodes(null)).toEqual([]);
    expect(searchEmojiShortcodes(undefined)).toEqual([]);
  });

  test('returns results when searching for "heart"', () => {
    const results = searchEmojiShortcodes('heart');
    expect(results.length).toBeGreaterThan(0);
  });

  test('returns results when searching for "fire"', () => {
    const results = searchEmojiShortcodes('fire');
    expect(results.length).toBeGreaterThan(0);
    const emojis = results.map(r => r.emoji);
    expect(emojis).toContain('🔥');
  });

  test('returns results when searching for "smile"', () => {
    const results = searchEmojiShortcodes('smile');
    expect(results.length).toBeGreaterThan(0);
  });

  test('each result has shortcode and emoji properties', () => {
    const results = searchEmojiShortcodes('heart');
    for (const result of results) {
      expect(result).toHaveProperty('shortcode');
      expect(result).toHaveProperty('emoji');
      expect(typeof result.shortcode).toBe('string');
      expect(typeof result.emoji).toBe('string');
    }
  });

  test('defaults to limit of 8 results', () => {
    // Use a broad query that matches many entries
    const results = searchEmojiShortcodes('a');
    expect(results.length).toBeLessThanOrEqual(8);
  });

  test('respects custom limit parameter', () => {
    const results = searchEmojiShortcodes('a', 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  test('limit of 1 returns at most one result', () => {
    const results = searchEmojiShortcodes('heart', 1);
    expect(results.length).toBe(1);
  });

  test('"starts with" matches are prioritized over "contains" matches', () => {
    const results = searchEmojiShortcodes('fire');
    // The first result's shortcode should start with "fire"
    expect(results[0].shortcode.startsWith('fire')).toBe(true);

    // Any result that doesn't start with "fire" should come after those that do
    let seenNonPrefix = false;
    for (const r of results) {
      if (!r.shortcode.startsWith('fire')) {
        seenNonPrefix = true;
      }
      if (seenNonPrefix) {
        expect(r.shortcode.startsWith('fire')).toBe(false);
      }
    }
  });

  test('no duplicate emojis in results', () => {
    const results = searchEmojiShortcodes('heart');
    const emojis = results.map(r => r.emoji);
    const uniqueEmojis = new Set(emojis);
    expect(uniqueEmojis.size).toBe(emojis.length);
  });

  test('no duplicate emojis in broad search results', () => {
    const results = searchEmojiShortcodes('a');
    const emojis = results.map(r => r.emoji);
    const uniqueEmojis = new Set(emojis);
    expect(uniqueEmojis.size).toBe(emojis.length);
  });

  test('search is case-insensitive', () => {
    const lower = searchEmojiShortcodes('heart');
    const upper = searchEmojiShortcodes('HEART');
    const mixed = searchEmojiShortcodes('Heart');
    expect(lower).toEqual(upper);
    expect(lower).toEqual(mixed);
  });

  test('returns empty array for query that matches nothing', () => {
    const results = searchEmojiShortcodes('zzznonexistent');
    expect(results).toEqual([]);
  });
});
