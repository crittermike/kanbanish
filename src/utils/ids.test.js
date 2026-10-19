import { describe, test, expect } from 'vitest';
import { generateId } from './ids';

describe('generateId', () => {
  test('generates distinct IDs suitable for Firebase paths and URLs', () => {
    const ids = Array.from({ length: 100 }, () => generateId());
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach(id => expect(id).toMatch(/^[a-z0-9]+$/));
  });
});
