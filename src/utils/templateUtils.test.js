import { describe, it, expect, beforeEach } from 'vitest';
import {
  getLastTemplateId,
  getTemplateBoardOptions,
  getTemplateSettings,
  getTemplateUrl,
  setLastTemplateId
} from './templateUtils';

describe('templateUtils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses defaultSettings when the template defines them', () => {
    const settings = { retrospectiveMode: true, multipleVotesAllowed: true };
    expect(getTemplateSettings({ tags: [], defaultSettings: settings })).toBe(settings);
  });

  it('retro-style templates start in Add with the poll on', () => {
    expect(getTemplateSettings({ tags: ['agile', 'team'] })).toEqual({ retrospectiveMode: true, flowPoll: true });
    expect(getTemplateSettings({ tags: ['kanban'] })).toEqual({ retrospectiveMode: false });
  });

  it('prefers shortName for the board title prefix', () => {
    const options = getTemplateBoardOptions({ name: 'Retrospective', shortName: 'Retro', columns: ['A'], tags: [] });
    expect(options).toEqual({ columns: ['A'], templateName: 'Retro', settingsOverrides: { retrospectiveMode: false } });
    expect(getTemplateBoardOptions({ name: 'DAKI', columns: [], tags: [] }).templateName).toBe('DAKI');
  });

  it('builds a ?template= URL', () => {
    expect(getTemplateUrl('lean-coffee')).toBe('?template=lean-coffee');
  });

  it('remembers the last-used template', () => {
    expect(getLastTemplateId()).toBeNull();
    setLastTemplateId('retro');
    expect(getLastTemplateId()).toBe('retro');
  });
});
