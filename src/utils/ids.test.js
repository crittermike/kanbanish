import { describe, test, expect } from 'vitest';
import { generateId } from './ids';

describe('generateId', () => {
  test('returns a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  test('returns a non-empty string', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  test('returns alphanumeric characters only', () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });

  test('returns IDs of consistent length', () => {
    // Each Math.random().toString(36).substring(2, 15) produces up to 13 chars
    // Two concatenated = up to 26 chars, minimum ~20 chars
    const id = generateId();
    expect(id.length).toBeGreaterThanOrEqual(20);
    expect(id.length).toBeLessThanOrEqual(26);
  });

  test('generates unique IDs across multiple calls', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    // All 100 IDs should be unique
    expect(ids.size).toBe(100);
  });

  test('does not generate IDs with uppercase characters', () => {
    for (let i = 0; i < 50; i++) {
      const id = generateId();
      expect(id).toBe(id.toLowerCase());
    }
  });
});
