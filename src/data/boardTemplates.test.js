import { describe, it, expect } from 'vitest';
import BOARD_TEMPLATES from './boardTemplates';

describe('BOARD_TEMPLATES', () => {
  it('defines usable templates with bookmarkable IDs and non-empty columns and tags', () => {
    expect(BOARD_TEMPLATES.length).toBeGreaterThan(0);
    BOARD_TEMPLATES.forEach((template) => {
      expect(template, template.id).toMatchObject({
        id: expect.stringMatching(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        name: expect.stringMatching(/\S/),
        description: expect.stringMatching(/\S/),
        icon: expect.stringMatching(/\S/),
        columns: expect.any(Array),
        tags: expect.any(Array)
      });
      expect(template.columns.length).toBeGreaterThan(0);
      expect(template.tags.length).toBeGreaterThan(0);
      template.columns.forEach(column => {
        expect(typeof column === 'string' ? column : column.title).toMatch(/\S/);
      });
      template.tags.forEach(tag => expect(tag).toMatch(/\S/));
    });
  });

  it('should have unique template IDs', () => {
    const ids = BOARD_TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('big-orca template should have exactly the correct columns', () => {
    const bigOrcaTemplate = BOARD_TEMPLATES.find((t) => t.id === 'big-orca');
    const expectedColumns = [
      { title: 'Good stuff', defaultTimerSeconds: 600 },
      { title: 'Bad stuff', defaultTimerSeconds: 600 },
      { title: 'Feelings', defaultTimerSeconds: 600 },
      { title: 'Improvements', defaultTimerSeconds: 600 },
      'Past commitments',
      'New commitments'
    ];
    expect(bigOrcaTemplate.columns).toEqual(expectedColumns);
  });

  it('big-orca template should have correct defaultSettings', () => {
    const bigOrcaTemplate = BOARD_TEMPLATES.find((t) => t.id === 'big-orca');
    expect(bigOrcaTemplate.defaultSettings).toBeDefined();
    expect(bigOrcaTemplate.defaultSettings.retrospectiveMode).toBe(false);
    expect(bigOrcaTemplate.defaultSettings.showDisplayNames).toBe(false);
    expect(bigOrcaTemplate.defaultSettings.workflowPhase).toBe('HEALTH_CHECK');
  });
});
