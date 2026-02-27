import { describe, it, expect } from 'vitest';
import { getEmojiKeywords, COMMON_EMOJIS } from './emoji';
import { generateId } from './ids';
import { parseUrlSettings, parseBool } from './urlSettings';

describe('parseUrlSettings', () => {
  it('parses boolean flags, numbers, and sort', () => {
    const { boardSettings, uiPrefs } = parseUrlSettings('?voting=true&downvotes=no&multivote=1&votes=7&retro=on&sort=votes&theme=light');
    expect(boardSettings).toEqual({
      votingEnabled: true,
      downvotingEnabled: false,
      multipleVotesAllowed: true,
      votesPerUser: 7,
      retrospectiveMode: true,
      sortByVotes: true
    });
    expect(uiPrefs).toEqual({ darkMode: false });
  });

  it('ignores invalid numbers and unknown values', () => {
    const { boardSettings, uiPrefs } = parseUrlSettings('?votes=abc&sort=unknown&theme=blue');
    expect(boardSettings).toEqual({});
    expect(uiPrefs).toEqual({});
  });

  it('handles plain query string without leading ?', () => {
    const { boardSettings } = parseUrlSettings('voting=0&downvotes=off');
    expect(boardSettings).toEqual({ votingEnabled: false, downvotingEnabled: false });
  });
});

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns unique values on multiple calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });

  it('has reasonable length (> 10 chars)', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(10);
  });
});

describe('parseBool', () => {
  it('returns true for truthy string values (case-insensitive)', () => {
    expect(parseBool('true')).toBe(true);
    expect(parseBool('1')).toBe(true);
    expect(parseBool('yes')).toBe(true);
    expect(parseBool('on')).toBe(true);
    expect(parseBool('TRUE')).toBe(true);
    expect(parseBool('Yes')).toBe(true);
    expect(parseBool('ON')).toBe(true);
  });

  it('returns false for falsy string values (case-insensitive)', () => {
    expect(parseBool('false')).toBe(false);
    expect(parseBool('0')).toBe(false);
    expect(parseBool('no')).toBe(false);
    expect(parseBool('off')).toBe(false);
    expect(parseBool('FALSE')).toBe(false);
    expect(parseBool('No')).toBe(false);
    expect(parseBool('OFF')).toBe(false);
  });

  it('returns undefined for non-string values', () => {
    expect(parseBool(42)).toBeUndefined();
    expect(parseBool(null)).toBeUndefined();
    expect(parseBool(undefined)).toBeUndefined();
    expect(parseBool(true)).toBeUndefined();
  });

  it('returns undefined for unrecognized strings', () => {
    expect(parseBool('maybe')).toBeUndefined();
    expect(parseBool('yep')).toBeUndefined();
    expect(parseBool('')).toBeUndefined();
  });

  it('handles whitespace', () => {
    expect(parseBool('  true  ')).toBe(true);
    expect(parseBool('  false  ')).toBe(false);
    expect(parseBool('  on  ')).toBe(true);
  });
});

describe('getEmojiKeywords', () => {
  it('returns array of keywords for known emoji', () => {
    const keywords = getEmojiKeywords('👍');
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords).toContain('thumbs');
    expect(keywords).toContain('up');
  });

  it('returns array with at least the emoji itself for unknown emojis', () => {
    const keywords = getEmojiKeywords('🏳️');
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords).toContain('🏳️');
  });

  it('returns non-empty array for common emojis', () => {
    const keywords = getEmojiKeywords('🔥');
    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords).toContain('fire');
  });
});

describe('COMMON_EMOJIS', () => {
  it('is an array with more than 100 items', () => {
    expect(Array.isArray(COMMON_EMOJIS)).toBe(true);
    expect(COMMON_EMOJIS.length).toBeGreaterThan(100);
  });

  it('contains only strings', () => {
    COMMON_EMOJIS.forEach(emoji => {
      expect(typeof emoji).toBe('string');
    });
  });
});
