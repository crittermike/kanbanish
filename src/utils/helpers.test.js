import { describe, it, expect } from 'vitest';
import { parseUrlSettings } from './helpers';

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
