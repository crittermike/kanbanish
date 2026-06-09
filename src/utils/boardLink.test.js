import { describe, it, expect } from 'vitest';
import { extractBoardId } from './boardLink';

describe('extractBoardId', () => {
  it('extracts the id from a full board URL', () => {
    expect(extractBoardId('https://www.kanbanish.com/?board=abc123')).toBe('abc123');
  });

  it('extracts the id when other query params are present', () => {
    expect(extractBoardId('https://www.kanbanish.com/?theme=dark&board=abc123')).toBe('abc123');
  });

  it('extracts the id from a protocol-less URL', () => {
    expect(extractBoardId('www.kanbanish.com/?board=abc123')).toBe('abc123');
  });

  it('extracts the id from a localhost URL with a port', () => {
    expect(extractBoardId('http://localhost:3000/?board=abc123')).toBe('abc123');
  });

  it('accepts a bare board id', () => {
    expect(extractBoardId('abc123')).toBe('abc123');
  });

  it('trims surrounding whitespace from a bare id', () => {
    expect(extractBoardId('  abc123  ')).toBe('abc123');
  });

  it('returns null for a URL without a board param', () => {
    expect(extractBoardId('https://www.kanbanish.com/')).toBeNull();
  });

  it('returns null for input with internal whitespace', () => {
    expect(extractBoardId('abc 123')).toBeNull();
  });

  it('returns null for path-like input without a board param', () => {
    expect(extractBoardId('kanbanish.com/some/path')).toBeNull();
  });

  it('returns null for empty or non-string input', () => {
    expect(extractBoardId('')).toBeNull();
    expect(extractBoardId('   ')).toBeNull();
    expect(extractBoardId(null)).toBeNull();
    expect(extractBoardId(undefined)).toBeNull();
    expect(extractBoardId(42)).toBeNull();
  });
});
