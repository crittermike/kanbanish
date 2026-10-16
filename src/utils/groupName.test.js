import { describe, expect, it } from 'vitest';
import { getDefaultGroupName } from './groupName';

describe('getDefaultGroupName', () => {
  it('uses the first non-empty line of the card', () => {
    expect(getDefaultGroupName('\n\nDeploys are slow\nsecond line')).toBe('Deploys are slow');
  });

  it('strips markdown markers', () => {
    expect(getDefaultGroupName('## **Flaky** `tests`')).toBe('Flaky tests');
    expect(getDefaultGroupName('- [ ] Fix CI')).toBe('Fix CI');
  });

  it('truncates long text', () => {
    const name = getDefaultGroupName('a'.repeat(60));
    expect(name).toHaveLength(40);
    expect(name.endsWith('…')).toBe(true);
  });

  it('falls back when there is no text', () => {
    expect(getDefaultGroupName('')).toBe('New Group');
    expect(getDefaultGroupName(undefined)).toBe('New Group');
    expect(getDefaultGroupName('***')).toBe('New Group');
  });
});
