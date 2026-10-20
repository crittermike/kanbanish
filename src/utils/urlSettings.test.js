import { describe, it, expect } from 'vitest';
import { parseBool, parseUrlSettings } from './urlSettings';

describe('parseBool', () => {
  describe('truthy values', () => {
    it('returns true for "true"', () => {
      expect(parseBool('true')).toBe(true);
    });

    it('returns true for "TRUE"', () => {
      expect(parseBool('TRUE')).toBe(true);
    });

    it('returns true for "True"', () => {
      expect(parseBool('True')).toBe(true);
    });

    it('returns true for "1"', () => {
      expect(parseBool('1')).toBe(true);
    });

    it('returns true for "yes"', () => {
      expect(parseBool('yes')).toBe(true);
    });

    it('returns true for "YES"', () => {
      expect(parseBool('YES')).toBe(true);
    });

    it('returns true for "on"', () => {
      expect(parseBool('on')).toBe(true);
    });

    it('returns true for "ON"', () => {
      expect(parseBool('ON')).toBe(true);
    });

    it('returns true for " true " with whitespace', () => {
      expect(parseBool(' true ')).toBe(true);
    });

    it('returns true for " TRUE " with whitespace', () => {
      expect(parseBool(' TRUE ')).toBe(true);
    });

    it('returns true for " 1 " with whitespace', () => {
      expect(parseBool(' 1 ')).toBe(true);
    });
  });

  describe('falsy values', () => {
    it('returns false for "false"', () => {
      expect(parseBool('false')).toBe(false);
    });

    it('returns false for "FALSE"', () => {
      expect(parseBool('FALSE')).toBe(false);
    });

    it('returns false for "False"', () => {
      expect(parseBool('False')).toBe(false);
    });

    it('returns false for "0"', () => {
      expect(parseBool('0')).toBe(false);
    });

    it('returns false for "no"', () => {
      expect(parseBool('no')).toBe(false);
    });

    it('returns false for "NO"', () => {
      expect(parseBool('NO')).toBe(false);
    });

    it('returns false for "off"', () => {
      expect(parseBool('off')).toBe(false);
    });

    it('returns false for "OFF"', () => {
      expect(parseBool('OFF')).toBe(false);
    });

    it('returns false for " false " with whitespace', () => {
      expect(parseBool(' false ')).toBe(false);
    });

    it('returns false for " 0 " with whitespace', () => {
      expect(parseBool(' 0 ')).toBe(false);
    });
  });

  describe('invalid values', () => {
    it('returns undefined for empty string', () => {
      expect(parseBool('')).toBeUndefined();
    });

    it('returns undefined for random string', () => {
      expect(parseBool('maybe')).toBeUndefined();
    });

    it('returns undefined for "2"', () => {
      expect(parseBool('2')).toBeUndefined();
    });

    it('returns undefined for null', () => {
      expect(parseBool(null)).toBeUndefined();
    });

    it('returns undefined for undefined', () => {
      expect(parseBool(undefined)).toBeUndefined();
    });

    it('returns undefined for number', () => {
      expect(parseBool(1)).toBeUndefined();
    });

    it('returns undefined for boolean (true)', () => {
      expect(parseBool(true)).toBeUndefined();
    });

    it('returns undefined for boolean (false)', () => {
      expect(parseBool(false)).toBeUndefined();
    });

    it('returns undefined for object', () => {
      expect(parseBool({})).toBeUndefined();
    });

    it('returns undefined for array', () => {
      expect(parseBool([])).toBeUndefined();
    });
  });
});

describe('parseUrlSettings', () => {
  describe('single voting parameter', () => {
    it('parses voting=true', () => {
      const result = parseUrlSettings('voting=true');
      expect(result.boardSettings.votingEnabled).toBe(true);
      expect(result.uiPrefs).toEqual({});
    });

    it('parses voting=false', () => {
      const result = parseUrlSettings('voting=false');
      expect(result.boardSettings.votingEnabled).toBe(false);
    });

    it('parses voting=1', () => {
      const result = parseUrlSettings('voting=1');
      expect(result.boardSettings.votingEnabled).toBe(true);
    });
  });

  describe('single downvotes parameter', () => {
    it('parses downvotes=true', () => {
      const result = parseUrlSettings('downvotes=true');
      expect(result.boardSettings.downvotingEnabled).toBe(true);
    });

    it('parses downvotes=false', () => {
      const result = parseUrlSettings('downvotes=false');
      expect(result.boardSettings.downvotingEnabled).toBe(false);
    });

    it('parses downvotes=0', () => {
      const result = parseUrlSettings('downvotes=0');
      expect(result.boardSettings.downvotingEnabled).toBe(false);
    });
  });

  describe('single multivote parameter', () => {
    it('parses multivote=true', () => {
      const result = parseUrlSettings('multivote=true');
      expect(result.boardSettings.multipleVotesAllowed).toBe(true);
    });

    it('parses multivote=1', () => {
      const result = parseUrlSettings('multivote=1');
      expect(result.boardSettings.multipleVotesAllowed).toBe(true);
    });

    it('parses multivote=false', () => {
      const result = parseUrlSettings('multivote=false');
      expect(result.boardSettings.multipleVotesAllowed).toBe(false);
    });
  });

  describe('votes parameter', () => {
    it('parses votes=5', () => {
      const result = parseUrlSettings('votes=5');
      expect(result.boardSettings.votesPerUser).toBe(5);
    });

    it('parses votes=1', () => {
      const result = parseUrlSettings('votes=1');
      expect(result.boardSettings.votesPerUser).toBe(1);
    });

    it('parses votes=10', () => {
      const result = parseUrlSettings('votes=10');
      expect(result.boardSettings.votesPerUser).toBe(10);
    });

    it('parses votes=999', () => {
      const result = parseUrlSettings('votes=999');
      expect(result.boardSettings.votesPerUser).toBe(999);
    });

    it('ignores votes=0 (invalid)', () => {
      const result = parseUrlSettings('votes=0');
      expect(result.boardSettings.votesPerUser).toBeUndefined();
    });

    it('ignores votes=-1 (invalid)', () => {
      const result = parseUrlSettings('votes=-1');
      expect(result.boardSettings.votesPerUser).toBeUndefined();
    });

    it('ignores votes=1000 (invalid)', () => {
      const result = parseUrlSettings('votes=1000');
      expect(result.boardSettings.votesPerUser).toBeUndefined();
    });

    it('ignores votes=abc (invalid)', () => {
      const result = parseUrlSettings('votes=abc');
      expect(result.boardSettings.votesPerUser).toBeUndefined();
    });

    it('ignores empty votes', () => {
      const result = parseUrlSettings('votes=');
      expect(result.boardSettings.votesPerUser).toBeUndefined();
    });
  });

  describe('retro parameter', () => {
    it('parses retro=true', () => {
      const result = parseUrlSettings('retro=true');
      expect(result.boardSettings.retrospectiveMode).toBe(true);
    });

    it('parses retro=yes', () => {
      const result = parseUrlSettings('retro=yes');
      expect(result.boardSettings.retrospectiveMode).toBe(true);
    });

    it('parses retro=false', () => {
      const result = parseUrlSettings('retro=false');
      expect(result.boardSettings.retrospectiveMode).toBe(false);
    });

    it('parses retro=on', () => {
      const result = parseUrlSettings('retro=on');
      expect(result.boardSettings.retrospectiveMode).toBe(true);
    });
  });

  describe('sort parameter', () => {
    it('parses sort=votes', () => {
      const result = parseUrlSettings('sort=votes');
      expect(result.boardSettings.sortByVotes).toBe(true);
    });

    it('parses sort=chrono', () => {
      const result = parseUrlSettings('sort=chrono');
      expect(result.boardSettings.sortByVotes).toBe(false);
    });

    it('parses sort=chronological', () => {
      const result = parseUrlSettings('sort=chronological');
      expect(result.boardSettings.sortByVotes).toBe(false);
    });

    it('parses sort=time', () => {
      const result = parseUrlSettings('sort=time');
      expect(result.boardSettings.sortByVotes).toBe(false);
    });

    it('parses sort=VOTES (case-insensitive)', () => {
      const result = parseUrlSettings('sort=VOTES');
      expect(result.boardSettings.sortByVotes).toBe(true);
    });

    it('ignores invalid sort value', () => {
      const result = parseUrlSettings('sort=invalid');
      expect(result.boardSettings.sortByVotes).toBeUndefined();
    });
  });

  describe('theme parameter', () => {
    it('parses theme=dark', () => {
      const result = parseUrlSettings('theme=dark');
      expect(result.uiPrefs.darkMode).toBe(true);
    });

    it('parses theme=light', () => {
      const result = parseUrlSettings('theme=light');
      expect(result.uiPrefs.darkMode).toBe(false);
    });

    it('parses theme=DARK (case-insensitive)', () => {
      const result = parseUrlSettings('theme=DARK');
      expect(result.uiPrefs.darkMode).toBe(true);
    });

    it('parses theme=LIGHT (case-insensitive)', () => {
      const result = parseUrlSettings('theme=LIGHT');
      expect(result.uiPrefs.darkMode).toBe(false);
    });

    it('ignores invalid theme value', () => {
      const result = parseUrlSettings('theme=blue');
      expect(result.uiPrefs.darkMode).toBeUndefined();
    });
  });

  describe('multiple parameters combined', () => {
    it('parses voting=true&downvotes=false&multivote=1', () => {
      const result = parseUrlSettings('voting=true&downvotes=false&multivote=1');
      expect(result.boardSettings.votingEnabled).toBe(true);
      expect(result.boardSettings.downvotingEnabled).toBe(false);
      expect(result.boardSettings.multipleVotesAllowed).toBe(true);
    });

    it('parses votes=5&retro=true&sort=votes', () => {
      const result = parseUrlSettings('votes=5&retro=true&sort=votes');
      expect(result.boardSettings.votesPerUser).toBe(5);
      expect(result.boardSettings.retrospectiveMode).toBe(true);
      expect(result.boardSettings.sortByVotes).toBe(true);
    });

    it('parses all parameters together', () => {
      const result = parseUrlSettings(
        'voting=true&downvotes=false&multivote=1&votes=10&retro=yes&sort=chrono&theme=dark'
      );
      expect(result.boardSettings.votingEnabled).toBe(true);
      expect(result.boardSettings.downvotingEnabled).toBe(false);
      expect(result.boardSettings.multipleVotesAllowed).toBe(true);
      expect(result.boardSettings.votesPerUser).toBe(10);
      expect(result.boardSettings.retrospectiveMode).toBe(true);
      expect(result.boardSettings.sortByVotes).toBe(false);
      expect(result.uiPrefs.darkMode).toBe(true);
    });

    it('separates board settings from ui prefs', () => {
      const result = parseUrlSettings('voting=true&theme=light');
      expect(Object.keys(result.boardSettings)).toEqual(['votingEnabled']);
      expect(Object.keys(result.uiPrefs)).toEqual(['darkMode']);
    });
  });

  describe('query string formatting', () => {
    it('accepts query string with leading ?', () => {
      const result = parseUrlSettings('?voting=true');
      expect(result.boardSettings.votingEnabled).toBe(true);
    });

    it('accepts query string without leading ?', () => {
      const result = parseUrlSettings('voting=true');
      expect(result.boardSettings.votingEnabled).toBe(true);
    });

    it('handles empty query string', () => {
      const result = parseUrlSettings('');
      expect(result.boardSettings).toEqual({});
      expect(result.uiPrefs).toEqual({});
    });

    it('handles empty query string with ?', () => {
      const result = parseUrlSettings('?');
      expect(result.boardSettings).toEqual({});
      expect(result.uiPrefs).toEqual({});
    });
  });

  describe('unknown parameters', () => {
    it('ignores unknown parameter', () => {
      const result = parseUrlSettings('unknown=value&voting=true');
      expect(Object.keys(result.boardSettings)).toEqual(['votingEnabled']);
      expect(result.boardSettings.votingEnabled).toBe(true);
    });

    it('ignores multiple unknown parameters', () => {
      const result = parseUrlSettings('foo=bar&voting=true&baz=qux');
      expect(Object.keys(result.boardSettings)).toEqual(['votingEnabled']);
    });
  });

  describe('whitespace handling', () => {
    it('handles whitespace in sort parameter', () => {
      const result = parseUrlSettings('sort= votes ');
      expect(result.boardSettings.sortByVotes).toBe(true);
    });

    it('handles whitespace in theme parameter', () => {
      const result = parseUrlSettings('theme= dark ');
      expect(result.uiPrefs.darkMode).toBe(true);
    });
  });

  describe('error handling', () => {
    it('returns empty objects for non-string input (null)', () => {
      const result = parseUrlSettings(null);
      expect(result).toEqual({ boardSettings: {}, uiPrefs: {} });
    });

    it('returns empty objects for non-string input (undefined)', () => {
      const result = parseUrlSettings(undefined);
      expect(result).toEqual({ boardSettings: {}, uiPrefs: {} });
    });

    it('returns empty objects for non-string input (number)', () => {
      const result = parseUrlSettings(123);
      expect(result).toEqual({ boardSettings: {}, uiPrefs: {} });
    });

    it('returns empty objects for non-string input (object)', () => {
      const result = parseUrlSettings({});
      expect(result).toEqual({ boardSettings: {}, uiPrefs: {} });
    });

    it('returns empty objects for non-string input (array)', () => {
      const result = parseUrlSettings([]);
      expect(result).toEqual({ boardSettings: {}, uiPrefs: {} });
    });
  });

  describe('integration scenarios', () => {
    it('parses realistic voting board URL', () => {
      const result = parseUrlSettings('voting=true&multivote=false&votes=3&sort=votes&theme=dark');
      expect(result.boardSettings).toEqual({
        votingEnabled: true,
        multipleVotesAllowed: false,
        votesPerUser: 3,
        sortByVotes: true,
      });
      expect(result.uiPrefs).toEqual({ darkMode: true });
    });

    it('parses realistic retrospective URL', () => {
      const result = parseUrlSettings('retro=true&voting=true&downvotes=true&theme=light');
      expect(result.boardSettings).toEqual({
        retrospectiveMode: true,
        votingEnabled: true,
        downvotingEnabled: true,
      });
      expect(result.uiPrefs).toEqual({ darkMode: false });
    });

    it('returns partial settings when some params are invalid', () => {
      const result = parseUrlSettings('voting=true&votes=invalid&sort=votes&theme=bad');
      expect(result.boardSettings).toEqual({
        votingEnabled: true,
        sortByVotes: true,
      });
      expect(result.uiPrefs).toEqual({});
    });
  });
});
