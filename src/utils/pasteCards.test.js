import { describe, it, expect } from 'vitest';
import { parsePastedCards } from './pasteCards';

describe('parsePastedCards', () => {
  it('makes one item per non-empty line, in order', () => {
    expect(parsePastedCards('First\n\n  Second  \r\nThird\n')).toEqual(['First', 'Second', 'Third']);
  });

  it('strips common list markers', () => {
    const text = [
      '- dash',
      '* star',
      '• bullet',
      '1. numbered',
      '2) paren',
      '[ ] todo',
      '- [x] done'
    ].join('\n');
    expect(parsePastedCards(text)).toEqual(['dash', 'star', 'bullet', 'numbered', 'paren', 'todo', 'done']);
  });

  it('keeps text that only looks like a marker mid-line', () => {
    expect(parsePastedCards('2024 goals - ship it')).toEqual(['2024 goals - ship it']);
  });
});
