import { describe, test, expect } from 'vitest';
import { COMMON_EMOJIS, getEmojiKeywords } from './emoji';

describe('COMMON_EMOJIS', () => {
  test('is a non-empty array', () => {
    expect(Array.isArray(COMMON_EMOJIS)).toBe(true);
    expect(COMMON_EMOJIS.length).toBeGreaterThan(0);
  });

  test('contains common emojis', () => {
    expect(COMMON_EMOJIS).toContain('😀');
    expect(COMMON_EMOJIS).toContain('👍');
    expect(COMMON_EMOJIS).toContain('❤️');
    expect(COMMON_EMOJIS).toContain('🔥');
    expect(COMMON_EMOJIS).toContain('🎉');
  });

  test('contains only strings', () => {
    COMMON_EMOJIS.forEach(emoji => {
      expect(typeof emoji).toBe('string');
    });
  });

  test('has no duplicate emojis', () => {
    const uniqueEmojis = new Set(COMMON_EMOJIS);
    expect(uniqueEmojis.size).toBe(COMMON_EMOJIS.length);
  });
});

describe('getEmojiKeywords', () => {
  test('returns an array', () => {
    const keywords = getEmojiKeywords('😀');
    expect(Array.isArray(keywords)).toBe(true);
  });

  test('returns keywords for a known emoji', () => {
    const keywords = getEmojiKeywords('😀');
    expect(keywords).toContain('grinning');
    expect(keywords).toContain('face');
    expect(keywords).toContain('smile');
    expect(keywords).toContain('happy');
  });

  test('includes the emoji character itself as a keyword', () => {
    const keywords = getEmojiKeywords('😀');
    expect(keywords).toContain('😀');
  });

  test('returns keywords for thumbs up emoji', () => {
    const keywords = getEmojiKeywords('👍');
    expect(keywords).toContain('thumbs');
    expect(keywords).toContain('up');
    expect(keywords).toContain('good');
    expect(keywords).toContain('like');
  });

  test('returns keywords for heart emoji', () => {
    const keywords = getEmojiKeywords('❤️');
    expect(keywords).toContain('red');
    expect(keywords).toContain('heart');
    expect(keywords).toContain('love');
  });

  test('returns keywords for fire emoji', () => {
    const keywords = getEmojiKeywords('🔥');
    expect(keywords).toContain('fire');
    expect(keywords).toContain('hot');
  });

  test('returns keywords for party emoji', () => {
    const keywords = getEmojiKeywords('🎉');
    expect(keywords).toContain('party');
    expect(keywords).toContain('celebration');
  });

  test('returns fallback keywords for an unknown emoji', () => {
    // An emoji not in the keywords map
    const keywords = getEmojiKeywords('🪐');
    // Should still return an array with at least the emoji itself
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords).toContain('🪐');
  });

  test('adds Unicode range keywords for face emojis', () => {
    // 😀 is U+1F600, in the face range 0x1F600-0x1F64F
    const keywords = getEmojiKeywords('😀');
    expect(keywords).toContain('face');
    expect(keywords).toContain('emotion');
    expect(keywords).toContain('smiley');
  });

  test('adds Unicode range keywords for symbol emojis', () => {
    // 🔥 is U+1F525, in the misc symbols range 0x1F300-0x1F5FF
    const keywords = getEmojiKeywords('🔥');
    expect(keywords).toContain('symbol');
    expect(keywords).toContain('misc');
    expect(keywords).toContain('object');
  });

  test('adds Unicode range keywords for transport emojis', () => {
    // 🚗 is U+1F697, in the transport range 0x1F680-0x1F6FF
    const keywords = getEmojiKeywords('🚗');
    expect(keywords).toContain('transport');
    expect(keywords).toContain('vehicle');
    expect(keywords).toContain('map');
  });

  test('returns keywords for christmas emojis', () => {
    const keywords = getEmojiKeywords('🎄');
    expect(keywords).toContain('christmas');
    expect(keywords).toContain('tree');
    expect(keywords).toContain('xmas');
  });

  test('returns keywords for salute emoji', () => {
    const keywords = getEmojiKeywords('🫡');
    expect(keywords).toContain('salute');
    expect(keywords).toContain('respect');
  });

  test('handles empty string gracefully', () => {
    const keywords = getEmojiKeywords('');
    expect(Array.isArray(keywords)).toBe(true);
    // Should still include the input and not crash
    expect(keywords).toContain('');
  });
});
