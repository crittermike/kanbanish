import { describe, it, expect } from 'vitest';
import BOARD_TEMPLATES from './boardTemplates';

describe('BOARD_TEMPLATES', () => {
  it('should be a non-empty array', () => {
    expect(Array.isArray(BOARD_TEMPLATES)).toBe(true);
    expect(BOARD_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('should have 30 templates', () => {
    expect(BOARD_TEMPLATES.length).toBe(30);
  });

  it('should have all required fields on every template', () => {
    BOARD_TEMPLATES.forEach((template) => {
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('columns');
      expect(template).toHaveProperty('icon');
      expect(template).toHaveProperty('tags');
    });
  });

  it('should have correct types for each field', () => {
    BOARD_TEMPLATES.forEach((template) => {
      expect(typeof template.id).toBe('string');
      expect(typeof template.name).toBe('string');
      expect(typeof template.description).toBe('string');
      expect(Array.isArray(template.columns)).toBe(true);
      expect(typeof template.icon).toBe('string');
      expect(Array.isArray(template.tags)).toBe(true);
    });
  });

  it('should have non-empty values for required fields', () => {
    BOARD_TEMPLATES.forEach((template) => {
      expect(template.id.length).toBeGreaterThan(0);
      expect(template.name.length).toBeGreaterThan(0);
      expect(template.description.length).toBeGreaterThan(0);
      expect(template.columns.length).toBeGreaterThan(0);
      expect(template.icon.length).toBeGreaterThan(0);
      expect(template.tags.length).toBeGreaterThan(0);
    });
  });

  it('should have unique template IDs', () => {
    const ids = BOARD_TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have the big-orca template', () => {
    const bigOrcaTemplate = BOARD_TEMPLATES.find((t) => t.id === 'big-orca');
    expect(bigOrcaTemplate).toBeDefined();
  });

  it('should have big-orca as the last template (easter egg)', () => {
    const lastTemplate = BOARD_TEMPLATES[BOARD_TEMPLATES.length - 1];
    expect(lastTemplate.id).toBe('big-orca');
  });

  it('big-orca template should have correct name and icon', () => {
    const bigOrcaTemplate = BOARD_TEMPLATES.find((t) => t.id === 'big-orca');
    expect(bigOrcaTemplate.name).toBe('Big Orca');
    expect(bigOrcaTemplate.icon).toBe('🐋');
  });

  it('big-orca template should have exactly the correct columns', () => {
    const bigOrcaTemplate = BOARD_TEMPLATES.find((t) => t.id === 'big-orca');
    const expectedColumns = [
      { title: 'Good stuff', defaultTimerSeconds: 600 },
      { title: 'Bad stuff', defaultTimerSeconds: 600 },
      'Feelings',
      'Improvements',
      'Past commitments',
      'New commitments'
    ];
    expect(bigOrcaTemplate.columns).toEqual(expectedColumns);
  });

  it('big-orca template should have retrospective-related tags', () => {
    const bigOrcaTemplate = BOARD_TEMPLATES.find((t) => t.id === 'big-orca');
    expect(bigOrcaTemplate.tags).toContain('retrospective');
    expect(bigOrcaTemplate.tags).toContain('team');
  });

  it('big-orca template should have skipWizard enabled', () => {
    const bigOrcaTemplate = BOARD_TEMPLATES.find((t) => t.id === 'big-orca');
    expect(bigOrcaTemplate.skipWizard).toBe(true);
  });

  it('big-orca template should have correct defaultSettings', () => {
    const bigOrcaTemplate = BOARD_TEMPLATES.find((t) => t.id === 'big-orca');
    expect(bigOrcaTemplate.defaultSettings).toBeDefined();
    expect(bigOrcaTemplate.defaultSettings.retrospectiveMode).toBe(false);
    expect(bigOrcaTemplate.defaultSettings.showDisplayNames).toBe(false);
    expect(bigOrcaTemplate.defaultSettings.actionItemsEnabled).toBe(false);
    expect(bigOrcaTemplate.defaultSettings.workflowPhase).toBe('HEALTH_CHECK');
  });

  it('should support findTemplateBySlug lookup by id', () => {
    const findTemplateBySlug = (slug) => BOARD_TEMPLATES.find((t) => t.id === slug);

    expect(findTemplateBySlug('default')).toBeDefined();
    expect(findTemplateBySlug('default').name).toBe('Default');
    expect(findTemplateBySlug('retro')).toBeDefined();
    expect(findTemplateBySlug('big-orca')).toBeDefined();
    expect(findTemplateBySlug('nonexistent')).toBeUndefined();
  });

  it('all column arrays should only contain non-empty strings or column config objects', () => {
    BOARD_TEMPLATES.forEach((template) => {
      template.columns.forEach((column) => {
        if (typeof column === 'string') {
          expect(column.length).toBeGreaterThan(0);
        } else {
          expect(typeof column).toBe('object');
          expect(typeof column.title).toBe('string');
          expect(column.title.length).toBeGreaterThan(0);
        }
      });
    });
  });

  it('all tag arrays should only contain non-empty strings', () => {
    BOARD_TEMPLATES.forEach((template) => {
      template.tags.forEach((tag) => {
        expect(typeof tag).toBe('string');
        expect(tag.length).toBeGreaterThan(0);
      });
    });
  });
});
