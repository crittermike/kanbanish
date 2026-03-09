import { describe, it, expect } from 'vitest';
import {
  WORKFLOW_PHASES,
  isGroupingAllowed,
  areInteractionsAllowed,
  areInteractionsVisible,
  areOthersInteractionsVisible,
  shouldObfuscateCards,
  areCardsRevealed,
  areInteractionsRevealed,
  isCardEditingAllowed,
  isCardCreationAllowed,
  isCardDraggingAllowed,
  isPollAllowed,
  arePollResultsVisible,
  getWorkflowDisabledReason,
  getPhaseDescription
} from './workflowUtils';

const ALL_PHASES = [
  WORKFLOW_PHASES.HEALTH_CHECK,
  WORKFLOW_PHASES.HEALTH_CHECK_RESULTS,
  WORKFLOW_PHASES.CREATION,
  WORKFLOW_PHASES.GROUPING,
  WORKFLOW_PHASES.INTERACTIONS,
  WORKFLOW_PHASES.RESULTS,
  WORKFLOW_PHASES.POLL,
  WORKFLOW_PHASES.POLL_RESULTS
];

describe('WORKFLOW_PHASES', () => {
  it('has all 8 phases', () => {
    expect(Object.keys(WORKFLOW_PHASES)).toHaveLength(8);
  });

  it('contains the expected phase keys', () => {
    expect(WORKFLOW_PHASES).toEqual({
      HEALTH_CHECK: 'HEALTH_CHECK',
      HEALTH_CHECK_RESULTS: 'HEALTH_CHECK_RESULTS',
      CREATION: 'CREATION',
      GROUPING: 'GROUPING',
      INTERACTIONS: 'INTERACTIONS',
      RESULTS: 'RESULTS',
      POLL: 'POLL',
      POLL_RESULTS: 'POLL_RESULTS'
    });
  });
});

describe('isGroupingAllowed', () => {
  it('returns false when retrospective mode is off (default)', () => {
    ALL_PHASES.forEach(phase => {
      expect(isGroupingAllowed(phase)).toBe(false);
    });
  });

  it('returns false when retrospective mode is explicitly false', () => {
    ALL_PHASES.forEach(phase => {
      expect(isGroupingAllowed(phase, false)).toBe(false);
    });
  });

  it('returns true only during GROUPING phase in retro mode', () => {
    expect(isGroupingAllowed(WORKFLOW_PHASES.GROUPING, true)).toBe(true);
  });

  it('returns false for all other phases in retro mode', () => {
    ALL_PHASES
      .filter(p => p !== WORKFLOW_PHASES.GROUPING)
      .forEach(phase => {
        expect(isGroupingAllowed(phase, true)).toBe(false);
      });
  });
});

describe('areInteractionsAllowed', () => {
  it('returns true when retrospective mode is off', () => {
    ALL_PHASES.forEach(phase => {
      expect(areInteractionsAllowed(phase)).toBe(true);
      expect(areInteractionsAllowed(phase, false)).toBe(true);
    });
  });

  it('returns true only during INTERACTIONS phase in retro mode', () => {
    expect(areInteractionsAllowed(WORKFLOW_PHASES.INTERACTIONS, true)).toBe(true);
  });

  it('returns false for all other phases in retro mode', () => {
    ALL_PHASES
      .filter(p => p !== WORKFLOW_PHASES.INTERACTIONS)
      .forEach(phase => {
        expect(areInteractionsAllowed(phase, true)).toBe(false);
      });
  });
});

describe('areInteractionsVisible', () => {
  it('returns true when retrospective mode is off', () => {
    ALL_PHASES.forEach(phase => {
      expect(areInteractionsVisible(phase)).toBe(true);
      expect(areInteractionsVisible(phase, false)).toBe(true);
    });
  });

  it('returns true during INTERACTIONS and RESULTS in retro mode', () => {
    expect(areInteractionsVisible(WORKFLOW_PHASES.INTERACTIONS, true)).toBe(true);
    expect(areInteractionsVisible(WORKFLOW_PHASES.RESULTS, true)).toBe(true);
  });

  it('returns false for all other phases in retro mode', () => {
    const visiblePhases = [
      WORKFLOW_PHASES.INTERACTIONS,
      WORKFLOW_PHASES.RESULTS
    ];
    ALL_PHASES
      .filter(p => !visiblePhases.includes(p))
      .forEach(phase => {
        expect(areInteractionsVisible(phase, true)).toBe(false);
      });
  });
});

describe('areOthersInteractionsVisible', () => {
  it('returns true when retrospective mode is off', () => {
    ALL_PHASES.forEach(phase => {
      expect(areOthersInteractionsVisible(phase)).toBe(true);
      expect(areOthersInteractionsVisible(phase, false)).toBe(true);
    });
  });

  it('returns true during RESULTS in retro mode', () => {
    expect(areOthersInteractionsVisible(WORKFLOW_PHASES.RESULTS, true)).toBe(true);
  });

  it('returns false for all other phases in retro mode', () => {
    const visiblePhases = [
      WORKFLOW_PHASES.RESULTS
    ];
    ALL_PHASES
      .filter(p => !visiblePhases.includes(p))
      .forEach(phase => {
        expect(areOthersInteractionsVisible(phase, true)).toBe(false);
      });
  });
});

describe('shouldObfuscateCards', () => {
  it('returns false when retrospective mode is off', () => {
    ALL_PHASES.forEach(phase => {
      expect(shouldObfuscateCards(phase)).toBe(false);
      expect(shouldObfuscateCards(phase, false)).toBe(false);
    });
  });

  it('returns true only during CREATION phase in retro mode', () => {
    expect(shouldObfuscateCards(WORKFLOW_PHASES.CREATION, true)).toBe(true);
  });

  it('returns false for all other phases in retro mode', () => {
    ALL_PHASES
      .filter(p => p !== WORKFLOW_PHASES.CREATION)
      .forEach(phase => {
        expect(shouldObfuscateCards(phase, true)).toBe(false);
      });
  });
});

describe('areCardsRevealed', () => {
  it('returns true when retrospective mode is off', () => {
    ALL_PHASES.forEach(phase => {
      expect(areCardsRevealed(phase)).toBe(true);
      expect(areCardsRevealed(phase, false)).toBe(true);
    });
  });

  it('returns true during GROUPING, INTERACTIONS, and RESULTS in retro mode', () => {
    expect(areCardsRevealed(WORKFLOW_PHASES.GROUPING, true)).toBe(true);
    expect(areCardsRevealed(WORKFLOW_PHASES.INTERACTIONS, true)).toBe(true);
    expect(areCardsRevealed(WORKFLOW_PHASES.RESULTS, true)).toBe(true);
  });

  it('returns false for all other phases in retro mode', () => {
    const revealedPhases = [
      WORKFLOW_PHASES.GROUPING,
      WORKFLOW_PHASES.INTERACTIONS,
      WORKFLOW_PHASES.RESULTS
    ];
    ALL_PHASES
      .filter(p => !revealedPhases.includes(p))
      .forEach(phase => {
        expect(areCardsRevealed(phase, true)).toBe(false);
      });
  });
});

describe('areInteractionsRevealed', () => {
  it('returns false when retrospective mode is off', () => {
    ALL_PHASES.forEach(phase => {
      expect(areInteractionsRevealed(phase)).toBe(false);
      expect(areInteractionsRevealed(phase, false)).toBe(false);
    });
  });

  it('returns true during RESULTS in retro mode', () => {
    expect(areInteractionsRevealed(WORKFLOW_PHASES.RESULTS, true)).toBe(true);
  });

  it('returns false for all other phases in retro mode', () => {
    const revealedPhases = [
      WORKFLOW_PHASES.RESULTS
    ];
    ALL_PHASES
      .filter(p => !revealedPhases.includes(p))
      .forEach(phase => {
        expect(areInteractionsRevealed(phase, true)).toBe(false);
      });
  });
});

describe('isCardEditingAllowed', () => {
  it('returns true when retrospective mode is off', () => {
    ALL_PHASES.forEach(phase => {
      expect(isCardEditingAllowed(phase)).toBe(true);
      expect(isCardEditingAllowed(phase, false)).toBe(true);
    });
  });

  it('returns true during CREATION and GROUPING in retro mode', () => {
    expect(isCardEditingAllowed(WORKFLOW_PHASES.CREATION, true)).toBe(true);
    expect(isCardEditingAllowed(WORKFLOW_PHASES.GROUPING, true)).toBe(true);
  });

  it('returns false for all other phases in retro mode', () => {
    const allowedPhases = [
      WORKFLOW_PHASES.CREATION,
      WORKFLOW_PHASES.GROUPING
    ];
    ALL_PHASES
      .filter(p => !allowedPhases.includes(p))
      .forEach(phase => {
        expect(isCardEditingAllowed(phase, true)).toBe(false);
      });
  });
});

describe('isCardCreationAllowed', () => {
  it('returns true when retrospective mode is off', () => {
    ALL_PHASES.forEach(phase => {
      expect(isCardCreationAllowed(phase)).toBe(true);
      expect(isCardCreationAllowed(phase, false)).toBe(true);
    });
  });

  it('returns true only during CREATION phase in retro mode', () => {
    expect(isCardCreationAllowed(WORKFLOW_PHASES.CREATION, true)).toBe(true);
  });

  it('returns false for all other phases in retro mode', () => {
    ALL_PHASES
      .filter(p => p !== WORKFLOW_PHASES.CREATION)
      .forEach(phase => {
        expect(isCardCreationAllowed(phase, true)).toBe(false);
      });
  });
});

describe('isCardDraggingAllowed', () => {
  it('returns true when retrospective mode is off', () => {
    ALL_PHASES.forEach(phase => {
      expect(isCardDraggingAllowed(phase)).toBe(true);
      expect(isCardDraggingAllowed(phase, false)).toBe(true);
    });
  });

  it('returns true only during GROUPING phase in retro mode', () => {
    expect(isCardDraggingAllowed(WORKFLOW_PHASES.GROUPING, true)).toBe(true);
  });

  it('returns false for all other phases in retro mode', () => {
    ALL_PHASES
      .filter(p => p !== WORKFLOW_PHASES.GROUPING)
      .forEach(phase => {
        expect(isCardDraggingAllowed(phase, true)).toBe(false);
      });
  });
});

describe('isPollAllowed', () => {
  it('returns false when retrospective mode is off', () => {
    ALL_PHASES.forEach(phase => {
      expect(isPollAllowed(phase)).toBe(false);
      expect(isPollAllowed(phase, false)).toBe(false);
    });
  });

  it('returns true only during POLL phase in retro mode', () => {
    expect(isPollAllowed(WORKFLOW_PHASES.POLL, true)).toBe(true);
  });

  it('returns false for all other phases in retro mode', () => {
    ALL_PHASES
      .filter(p => p !== WORKFLOW_PHASES.POLL)
      .forEach(phase => {
        expect(isPollAllowed(phase, true)).toBe(false);
      });
  });
});

describe('arePollResultsVisible', () => {
  it('returns false when retrospective mode is off', () => {
    ALL_PHASES.forEach(phase => {
      expect(arePollResultsVisible(phase)).toBe(false);
      expect(arePollResultsVisible(phase, false)).toBe(false);
    });
  });

  it('returns true only during POLL_RESULTS phase in retro mode', () => {
    expect(arePollResultsVisible(WORKFLOW_PHASES.POLL_RESULTS, true)).toBe(true);
  });

  it('returns false for all other phases in retro mode', () => {
    ALL_PHASES
      .filter(p => p !== WORKFLOW_PHASES.POLL_RESULTS)
      .forEach(phase => {
        expect(arePollResultsVisible(phase, true)).toBe(false);
      });
  });
});

describe('getWorkflowDisabledReason', () => {
  // NOTE: getWorkflowDisabledReason calls check functions WITHOUT retrospectiveMode,
  // so they use default (false). This means:
  // - isGroupingAllowed(phase) always returns false (grouping requires retro mode)
  // - areInteractionsAllowed(phase) always returns true (interactions allowed when retro off)
  // - isCardEditingAllowed(phase) always returns true
  // - isCardDraggingAllowed(phase) always returns true

  it('always returns a reason for grouping (grouping requires retro mode)', () => {
    ALL_PHASES.forEach(phase => {
      expect(getWorkflowDisabledReason('grouping', phase))
        .toBe('Grouping is only allowed during the grouping phase');
    });
  });

  it('never returns a reason for interactions (allowed when retro is off)', () => {
    ALL_PHASES.forEach(phase => {
      expect(getWorkflowDisabledReason('interactions', phase)).toBeNull();
    });
  });

  it('never returns a reason for editing (allowed when retro is off)', () => {
    ALL_PHASES.forEach(phase => {
      expect(getWorkflowDisabledReason('editing', phase)).toBeNull();
    });
  });

  it('never returns a reason for dragging (allowed when retro is off)', () => {
    ALL_PHASES.forEach(phase => {
      expect(getWorkflowDisabledReason('dragging', phase)).toBeNull();
    });
  });

  it('returns null for an unknown action', () => {
    expect(getWorkflowDisabledReason('unknown', WORKFLOW_PHASES.CREATION)).toBeNull();
  });

  it('returns a reason for grouping with null phase', () => {
    expect(getWorkflowDisabledReason('grouping', null)).toBe('Grouping is only allowed during the grouping phase');
  });

  it('returns null for interactions/editing/dragging with null phase', () => {
    expect(getWorkflowDisabledReason('interactions', null)).toBeNull();
    expect(getWorkflowDisabledReason('editing', null)).toBeNull();
    expect(getWorkflowDisabledReason('dragging', null)).toBeNull();
  });
});

describe('getPhaseDescription', () => {
  it('returns the correct description for each phase', () => {
    expect(getPhaseDescription(WORKFLOW_PHASES.HEALTH_CHECK))
      .toBe('Rate how the team is feeling about key areas');
    expect(getPhaseDescription(WORKFLOW_PHASES.HEALTH_CHECK_RESULTS))
      .toBe('Review team health check results');
    expect(getPhaseDescription(WORKFLOW_PHASES.CREATION))
      .toBe('Create and add cards to the board');
    expect(getPhaseDescription(WORKFLOW_PHASES.GROUPING))
      .toBe('Group related cards together');
    expect(getPhaseDescription(WORKFLOW_PHASES.INTERACTIONS))
      .toBe('Add comments, votes, and reactions');
    expect(getPhaseDescription(WORKFLOW_PHASES.RESULTS))
      .toBe('View top-voted items');
    expect(getPhaseDescription(WORKFLOW_PHASES.POLL))
      .toBe('Rate the effectiveness of this retrospective');
    expect(getPhaseDescription(WORKFLOW_PHASES.POLL_RESULTS))
      .toBe('View retrospective effectiveness ratings');
  });

  it('returns "Unknown phase" for an unknown phase', () => {
    expect(getPhaseDescription('NONEXISTENT')).toBe('Unknown phase');
    expect(getPhaseDescription(null)).toBe('Unknown phase');
    expect(getPhaseDescription(undefined)).toBe('Unknown phase');
  });
});
