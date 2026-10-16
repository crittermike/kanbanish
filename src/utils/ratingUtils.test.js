import { describe, it, expect } from 'vitest';
import { getScoreLabel, getScoreRatingLevel } from './ratingUtils';

describe('ratingUtils', () => {
  describe('getScoreRatingLevel', () => {
    it('returns 5 for averages >= 4.5', () => {
      expect(getScoreRatingLevel(4.5)).toBe(5);
      expect(getScoreRatingLevel(5.0)).toBe(5);
      expect(getScoreRatingLevel(4.9)).toBe(5);
    });

    it('returns 4 for averages >= 3.5 and < 4.5', () => {
      expect(getScoreRatingLevel(3.5)).toBe(4);
      expect(getScoreRatingLevel(4.4)).toBe(4);
      expect(getScoreRatingLevel(4.0)).toBe(4);
    });

    it('returns 3 for averages >= 2.5 and < 3.5', () => {
      expect(getScoreRatingLevel(2.5)).toBe(3);
      expect(getScoreRatingLevel(3.4)).toBe(3);
      expect(getScoreRatingLevel(3.0)).toBe(3);
    });

    it('returns 2 for averages >= 1.5 and < 2.5', () => {
      expect(getScoreRatingLevel(1.5)).toBe(2);
      expect(getScoreRatingLevel(2.4)).toBe(2);
      expect(getScoreRatingLevel(2.0)).toBe(2);
    });

    it('returns 1 for averages < 1.5', () => {
      expect(getScoreRatingLevel(1.4)).toBe(1);
      expect(getScoreRatingLevel(1.0)).toBe(1);
      expect(getScoreRatingLevel(0)).toBe(1);
    });
  });

  describe('getScoreLabel', () => {
    it('returns "Great" for averages >= 4.5', () => {
      expect(getScoreLabel(4.5)).toBe('Great');
      expect(getScoreLabel(5.0)).toBe('Great');
    });

    it('returns "Good" for averages >= 3.5 and < 4.5', () => {
      expect(getScoreLabel(3.5)).toBe('Good');
      expect(getScoreLabel(4.4)).toBe('Good');
    });

    it('returns "Okay" for averages >= 2.5 and < 3.5', () => {
      expect(getScoreLabel(2.5)).toBe('Okay');
      expect(getScoreLabel(3.4)).toBe('Okay');
    });

    it('returns "Poor" for averages >= 1.5 and < 2.5', () => {
      expect(getScoreLabel(1.5)).toBe('Poor');
      expect(getScoreLabel(2.4)).toBe('Poor');
    });

    it('returns "Terrible" for averages < 1.5', () => {
      expect(getScoreLabel(1.4)).toBe('Terrible');
      expect(getScoreLabel(0)).toBe('Terrible');
    });
  });
});
