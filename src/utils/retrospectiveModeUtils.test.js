import { describe, it, expect } from 'vitest';
import {
  getRevealPhase,
  shouldObfuscateContent,
  areInteractionsDisabled,
  getDisabledReason,
  shouldUseDisabledStyling,
  shouldHideFeature,
  getReactionDisabledMessage,
  getCommentDisabledMessage
} from './retrospectiveModeUtils';
import { WORKFLOW_PHASES } from './workflowUtils';

const ALL_PHASES = [
  WORKFLOW_PHASES.HEALTH_CHECK,
  WORKFLOW_PHASES.HEALTH_CHECK_RESULTS,
  WORKFLOW_PHASES.CREATION,
  WORKFLOW_PHASES.GROUPING,
  WORKFLOW_PHASES.INTERACTIONS,
  WORKFLOW_PHASES.INTERACTION_REVEAL,
  WORKFLOW_PHASES.RESULTS,
  WORKFLOW_PHASES.POLL,
  WORKFLOW_PHASES.POLL_RESULTS
];

describe('getRevealPhase', () => {
  it('returns "normal" when retrospective mode is disabled', () => {
    ALL_PHASES.forEach(phase => {
      expect(getRevealPhase(false, phase)).toBe('normal');
    });
  });

  it('returns "hidden" during CREATION (cards not revealed)', () => {
    expect(getRevealPhase(true, WORKFLOW_PHASES.CREATION)).toBe('hidden');
  });

  it('returns "hidden" during phases where cards are not revealed', () => {
    // HEALTH_CHECK, HEALTH_CHECK_RESULTS, POLL, POLL_RESULTS also have cards not revealed
    expect(getRevealPhase(true, WORKFLOW_PHASES.HEALTH_CHECK)).toBe('hidden');
    expect(getRevealPhase(true, WORKFLOW_PHASES.HEALTH_CHECK_RESULTS)).toBe('hidden');
    expect(getRevealPhase(true, WORKFLOW_PHASES.POLL)).toBe('hidden');
    expect(getRevealPhase(true, WORKFLOW_PHASES.POLL_RESULTS)).toBe('hidden');
  });

  it('returns "interactive" during GROUPING and INTERACTIONS (cards revealed, interactions not revealed)', () => {
    expect(getRevealPhase(true, WORKFLOW_PHASES.GROUPING)).toBe('interactive');
    expect(getRevealPhase(true, WORKFLOW_PHASES.INTERACTIONS)).toBe('interactive');
  });

  it('returns "frozen" during INTERACTION_REVEAL and RESULTS (interactions revealed)', () => {
    expect(getRevealPhase(true, WORKFLOW_PHASES.INTERACTION_REVEAL)).toBe('frozen');
    expect(getRevealPhase(true, WORKFLOW_PHASES.RESULTS)).toBe('frozen');
  });
});

describe('shouldObfuscateContent', () => {
  it('returns false when retrospective mode is off', () => {
    ALL_PHASES.forEach(phase => {
      expect(shouldObfuscateContent(false, phase)).toBe(false);
      expect(shouldObfuscateContent(false, phase, true)).toBe(false);
      expect(shouldObfuscateContent(false, phase, false)).toBe(false);
    });
  });

  it('returns true when retro is on, cards not revealed, and user is not creator', () => {
    // CREATION phase has cards not revealed
    expect(shouldObfuscateContent(true, WORKFLOW_PHASES.CREATION, false)).toBe(true);
    expect(shouldObfuscateContent(true, WORKFLOW_PHASES.CREATION)).toBe(true); // default isCreator=false
    expect(shouldObfuscateContent(true, WORKFLOW_PHASES.HEALTH_CHECK, false)).toBe(true);
  });

  it('returns false when retro is on, cards not revealed, but user IS the creator', () => {
    expect(shouldObfuscateContent(true, WORKFLOW_PHASES.CREATION, true)).toBe(false);
    expect(shouldObfuscateContent(true, WORKFLOW_PHASES.HEALTH_CHECK, true)).toBe(false);
  });

  it('returns false when retro is on and cards are revealed (regardless of isCreator)', () => {
    const revealedPhases = [
      WORKFLOW_PHASES.GROUPING,
      WORKFLOW_PHASES.INTERACTIONS,
      WORKFLOW_PHASES.INTERACTION_REVEAL,
      WORKFLOW_PHASES.RESULTS
    ];
    revealedPhases.forEach(phase => {
      expect(shouldObfuscateContent(true, phase, false)).toBe(false);
      expect(shouldObfuscateContent(true, phase, true)).toBe(false);
    });
  });
});

describe('areInteractionsDisabled', () => {
  it('returns false when retro is off and interactions are not revealed', () => {
    // areInteractionsRevealed returns false when retro is off
    // areCardsRevealed returns true when retro is off
    // So: (false && !true) || false => false
    ALL_PHASES.forEach(phase => {
      expect(areInteractionsDisabled(false, phase)).toBe(false);
    });
  });

  it('returns true when retro is on and cards are not revealed', () => {
    // Cards not revealed: HEALTH_CHECK, HEALTH_CHECK_RESULTS, CREATION, POLL, POLL_RESULTS
    const unrevealed = [
      WORKFLOW_PHASES.HEALTH_CHECK,
      WORKFLOW_PHASES.HEALTH_CHECK_RESULTS,
      WORKFLOW_PHASES.CREATION,
      WORKFLOW_PHASES.POLL,
      WORKFLOW_PHASES.POLL_RESULTS
    ];
    unrevealed.forEach(phase => {
      expect(areInteractionsDisabled(true, phase)).toBe(true);
    });
  });

  it('returns false during GROUPING and INTERACTIONS (cards revealed, interactions not revealed)', () => {
    expect(areInteractionsDisabled(true, WORKFLOW_PHASES.GROUPING)).toBe(false);
    expect(areInteractionsDisabled(true, WORKFLOW_PHASES.INTERACTIONS)).toBe(false);
  });

  it('returns true during INTERACTION_REVEAL and RESULTS (interactions revealed/frozen)', () => {
    expect(areInteractionsDisabled(true, WORKFLOW_PHASES.INTERACTION_REVEAL)).toBe(true);
    expect(areInteractionsDisabled(true, WORKFLOW_PHASES.RESULTS)).toBe(true);
  });
});

describe('getDisabledReason', () => {
  it('returns null when interactions are not disabled', () => {
    expect(getDisabledReason(false, WORKFLOW_PHASES.INTERACTIONS)).toBeNull();
    expect(getDisabledReason(true, WORKFLOW_PHASES.GROUPING)).toBeNull();
    expect(getDisabledReason(true, WORKFLOW_PHASES.INTERACTIONS)).toBeNull();
  });

  it('returns "frozen" when interactions are revealed (INTERACTION_REVEAL, RESULTS)', () => {
    expect(getDisabledReason(true, WORKFLOW_PHASES.INTERACTION_REVEAL)).toBe('frozen');
    expect(getDisabledReason(true, WORKFLOW_PHASES.RESULTS)).toBe('frozen');
  });

  it('returns "cards-not-revealed" when cards are not yet revealed', () => {
    expect(getDisabledReason(true, WORKFLOW_PHASES.CREATION)).toBe('cards-not-revealed');
    expect(getDisabledReason(true, WORKFLOW_PHASES.HEALTH_CHECK)).toBe('cards-not-revealed');
    expect(getDisabledReason(true, WORKFLOW_PHASES.HEALTH_CHECK_RESULTS)).toBe('cards-not-revealed');
    expect(getDisabledReason(true, WORKFLOW_PHASES.POLL)).toBe('cards-not-revealed');
    expect(getDisabledReason(true, WORKFLOW_PHASES.POLL_RESULTS)).toBe('cards-not-revealed');
  });
});

describe('shouldUseDisabledStyling', () => {
  it('returns false when not disabled', () => {
    expect(shouldUseDisabledStyling(false, null)).toBe(false);
    expect(shouldUseDisabledStyling(false, 'frozen')).toBe(false);
    expect(shouldUseDisabledStyling(false, 'cards-not-revealed')).toBe(false);
  });

  it('returns true when disabled and reason is not "frozen"', () => {
    expect(shouldUseDisabledStyling(true, 'cards-not-revealed')).toBe(true);
    expect(shouldUseDisabledStyling(true, null)).toBe(true);
    expect(shouldUseDisabledStyling(true, undefined)).toBe(true);
  });

  it('returns false when disabled but reason is "frozen"', () => {
    expect(shouldUseDisabledStyling(true, 'frozen')).toBe(false);
  });
});

describe('shouldHideFeature', () => {
  it('returns true when reason is "frozen"', () => {
    expect(shouldHideFeature('frozen')).toBe(true);
  });

  it('returns false for other reasons', () => {
    expect(shouldHideFeature('cards-not-revealed')).toBe(false);
    expect(shouldHideFeature(null)).toBe(false);
    expect(shouldHideFeature(undefined)).toBe(false);
    expect(shouldHideFeature('')).toBe(false);
  });
});

describe('getReactionDisabledMessage', () => {
  it('returns frozen message for "frozen" reason', () => {
    expect(getReactionDisabledMessage('frozen'))
      .toBe('Interactions are now frozen - no more changes allowed');
  });

  it('returns not-revealed message for "cards-not-revealed" reason', () => {
    expect(getReactionDisabledMessage('cards-not-revealed'))
      .toBe('Reactions disabled until cards are revealed');
  });

  it('returns default (not-revealed) message for unknown reasons', () => {
    expect(getReactionDisabledMessage('something-else'))
      .toBe('Reactions disabled until cards are revealed');
    expect(getReactionDisabledMessage(undefined))
      .toBe('Reactions disabled until cards are revealed');
  });
});

describe('getCommentDisabledMessage', () => {
  it('returns null for "frozen" reason (silent behavior)', () => {
    expect(getCommentDisabledMessage('frozen')).toBeNull();
  });

  it('returns not-revealed message for "cards-not-revealed" reason', () => {
    expect(getCommentDisabledMessage('cards-not-revealed'))
      .toBe('Comments are disabled until cards are revealed');
  });

  it('returns default (not-revealed) message for unknown reasons', () => {
    expect(getCommentDisabledMessage('something-else'))
      .toBe('Comments are disabled until cards are revealed');
    expect(getCommentDisabledMessage(undefined))
      .toBe('Comments are disabled until cards are revealed');
  });
});
