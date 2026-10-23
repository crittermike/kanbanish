import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';
import { useWorkflow } from './useWorkflow';

const createMockProps = (overrides = {}) => ({
  updateBoardSettings: vi.fn(),
  columns: {},
  workflowPhase: WORKFLOW_PHASES.CREATION,
  resultsViewIndex: 0,
  removeAllGrouping: vi.fn(() => Promise.resolve()),
  clearVotes: vi.fn(() => Promise.resolve()),
  showNotification: vi.fn(),
  ...overrides
});

describe('useWorkflow', () => {
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startFlow / endFlow', () => {
    it('starts at Add with voting on, clears earlier votes and answers, and records the start time', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(1000);
      mockProps = createMockProps({ resetPoll: vi.fn(), resetHealthCheck: vi.fn() });
      const { result } = renderHook(() => useWorkflow(mockProps));

      await act(async () => {
        await result.current.startFlow();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        retrospectiveMode: true,
        votingEnabled: true,
        workflowPhase: WORKFLOW_PHASES.CREATION,
        resultsViewIndex: 0,
        flowStartedAt: 1000
      });
      expect(mockProps.resetPoll).toHaveBeenCalled();
      expect(mockProps.resetHealthCheck).toHaveBeenCalled();
      expect(mockProps.clearVotes).toHaveBeenCalledOnce();
      Date.now.mockRestore();
    });

    it('waits for votes to clear before starting a run', async () => {
      let finishReset;
      mockProps = createMockProps({
        clearVotes: vi.fn(() => new Promise(resolve => { finishReset = resolve; }))
      });
      const { result } = renderHook(() => useWorkflow(mockProps));
      const starting = result.current.startFlow();
      expect(mockProps.updateBoardSettings).not.toHaveBeenCalled();
      finishReset();
      await act(async () => { await starting; });
      expect(mockProps.updateBoardSettings).toHaveBeenCalledOnce();
    });

    it('does not start a run when votes cannot be cleared', async () => {
      const error = new Error('Permission denied');
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockProps = createMockProps({
        clearVotes: vi.fn().mockRejectedValue(error),
        resetPoll: vi.fn(),
        resetHealthCheck: vi.fn()
      });
      const { result } = renderHook(() => useWorkflow(mockProps));
      await act(async () => { await result.current.startFlow(); });
      expect(mockProps.updateBoardSettings).not.toHaveBeenCalled();
      expect(mockProps.resetPoll).not.toHaveBeenCalled();
      expect(mockProps.resetHealthCheck).not.toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith(expect.stringContaining('could not be reset'));
      expect(log).toHaveBeenCalledWith(expect.any(String), error);
      log.mockRestore();
    });

    it('ends back on the plain board', () => {
      mockProps = createMockProps({ retrospectiveMode: true, workflowPhase: WORKFLOW_PHASES.INTERACTIONS });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.endFlow();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        retrospectiveMode: false,
        workflowPhase: WORKFLOW_PHASES.CREATION,
        resultsViewIndex: 0
      });
      expect(mockProps.clearVotes).not.toHaveBeenCalled();
    });
  });

  describe('goToPhase', () => {
    it('starts a run at the chosen step when none is in progress', async () => {
      mockProps = createMockProps();
      const { result } = renderHook(() => useWorkflow(mockProps));

      await act(async () => {
        await result.current.goToPhase(WORKFLOW_PHASES.GROUPING);
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith(expect.objectContaining({
        retrospectiveMode: true,
        workflowPhase: WORKFLOW_PHASES.GROUPING
      }));
    });

    it('keeps a template health check\'s answers when moving on to the steps', async () => {
      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.HEALTH_CHECK_RESULTS,
        resetPoll: vi.fn(),
        resetHealthCheck: vi.fn()
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      await act(async () => {
        await result.current.goToPhase(WORKFLOW_PHASES.CREATION);
      });

      expect(mockProps.resetHealthCheck).not.toHaveBeenCalled();
      expect(mockProps.clearVotes).toHaveBeenCalledOnce();
      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith(expect.objectContaining({
        retrospectiveMode: true,
        workflowPhase: WORKFLOW_PHASES.CREATION
      }));
    });

    it('jumps straight to a later step', () => {
      mockProps = createMockProps({ retrospectiveMode: true });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.goToPhase(WORKFLOW_PHASES.RESULTS);
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.RESULTS,
        resultsViewIndex: 0
      });
      expect(mockProps.clearVotes).not.toHaveBeenCalled();
    });

    it('confirms and undoes this run\'s grouping when going back to Add', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockProps = createMockProps({
        retrospectiveMode: true,
        workflowPhase: WORKFLOW_PHASES.INTERACTIONS,
        columns: { col1: { cards: {}, groups: { group1: { name: 'Group 1' } } } }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      await act(async () => {
        result.current.goToPhase(WORKFLOW_PHASES.CREATION);
      });

      expect(window.confirm).toHaveBeenCalled();
      expect(mockProps.removeAllGrouping).toHaveBeenCalled();
      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({ workflowPhase: WORKFLOW_PHASES.CREATION });
      window.confirm.mockRestore();
    });

    it('stays put when going back to Add is cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      mockProps = createMockProps({
        retrospectiveMode: true,
        workflowPhase: WORKFLOW_PHASES.GROUPING,
        columns: { col1: { cards: {}, groups: { group1: { name: 'Group 1' } } } }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.goToPhase(WORKFLOW_PHASES.CREATION);
      });

      expect(mockProps.removeAllGrouping).not.toHaveBeenCalled();
      expect(mockProps.updateBoardSettings).not.toHaveBeenCalled();
      window.confirm.mockRestore();
    });

    it('keeps groups from earlier runs when going back to Add', () => {
      vi.spyOn(window, 'confirm');
      mockProps = createMockProps({
        retrospectiveMode: true,
        workflowPhase: WORKFLOW_PHASES.GROUPING,
        flowStartedAt: 500,
        columns: {
          col1: {
            cards: { old: { created: 100 } },
            groups: { group1: { name: 'Old', cardIds: ['old'] } }
          }
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.goToPhase(WORKFLOW_PHASES.CREATION);
      });

      expect(window.confirm).not.toHaveBeenCalled();
      expect(mockProps.removeAllGrouping).not.toHaveBeenCalled();
      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({ workflowPhase: WORKFLOW_PHASES.CREATION });
      window.confirm.mockRestore();
    });
  });

  describe('navigateResults', () => {
    it('should increment resultsViewIndex when direction is next', () => {
      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.RESULTS,
        resultsViewIndex: 0,
        columns: {
          col1: {
            cards: {
              card1: { content: 'Card 1', votes: 5 },
              card2: { content: 'Card 2', votes: 3 }
            }
          }
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.navigateResults('next');
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        resultsViewIndex: 1
      });
    });

    it('should decrement resultsViewIndex when direction is prev', () => {
      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.RESULTS,
        resultsViewIndex: 1,
        columns: {
          col1: {
            cards: {
              card1: { content: 'Card 1', votes: 5 },
              card2: { content: 'Card 2', votes: 3 }
            }
          }
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.navigateResults('prev');
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        resultsViewIndex: 0
      });
    });

    it('should not navigate when not in RESULTS phase', () => {
      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.CREATION,
        resultsViewIndex: 0
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.navigateResults('next');
      });

      expect(mockProps.updateBoardSettings).not.toHaveBeenCalled();
    });

    it('should not go below 0 when navigating prev at index 0', () => {
      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.RESULTS,
        resultsViewIndex: 0,
        columns: {
          col1: {
            cards: {
              card1: { content: 'Card 1', votes: 5 }
            }
          }
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.navigateResults('prev');
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        resultsViewIndex: 0
      });
    });

    it('should not go above max index when navigating next at last item', () => {
      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.RESULTS,
        resultsViewIndex: 1,
        columns: {
          col1: {
            cards: {
              card1: { content: 'Card 1', votes: 5 },
              card2: { content: 'Card 2', votes: 3 }
            }
          }
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.navigateResults('next');
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        resultsViewIndex: 1
      });
    });
  });

  describe('getSortedItemsForResults', () => {
    it('should return cards and groups sorted by votes descending', () => {
      mockProps = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'Low votes', votes: 1 },
              card2: { content: 'High votes', votes: 10 }
            },
            groups: {
              group1: { name: 'Medium group', votes: 5 }
            }
          }
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      const items = result.current.getSortedItemsForResults();

      expect(items).toHaveLength(3);
      expect(items[0].votes).toBe(10);
      expect(items[0].type).toBe('card');
      expect(items[0].id).toBe('card2');
      expect(items[1].votes).toBe(5);
      expect(items[1].type).toBe('group');
      expect(items[1].id).toBe('group1');
      expect(items[2].votes).toBe(1);
      expect(items[2].type).toBe('card');
      expect(items[2].id).toBe('card1');
    });

    it('should exclude cards that are in groups', () => {
      mockProps = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'Standalone', votes: 3 },
              card2: { content: 'In group', votes: 8, groupId: 'group1' }
            },
            groups: {
              group1: { name: 'A group', votes: 8 }
            }
          }
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      const items = result.current.getSortedItemsForResults();

      expect(items).toHaveLength(2);
      // card2 is excluded because it has a groupId
      const cardIds = items.filter(i => i.type === 'card').map(i => i.id);
      expect(cardIds).toEqual(['card1']);
      const groupIds = items.filter(i => i.type === 'group').map(i => i.id);
      expect(groupIds).toEqual(['group1']);
    });

    it('should return empty array when no columns have cards or groups', () => {
      mockProps = createMockProps({
        columns: {
          col1: { cards: {}, groups: {} }
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      const items = result.current.getSortedItemsForResults();

      expect(items).toEqual([]);
    });

    it('should handle columns with no cards or groups keys', () => {
      mockProps = createMockProps({
        columns: {
          col1: {}
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      const items = result.current.getSortedItemsForResults();

      expect(items).toEqual([]);
    });

    it('should default votes to 0 when not set', () => {
      mockProps = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'No votes field' }
            },
            groups: {
              group1: { name: 'No votes group' }
            }
          }
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      const items = result.current.getSortedItemsForResults();

      expect(items).toHaveLength(2);
      expect(items[0].votes).toBe(0);
      expect(items[1].votes).toBe(0);
    });

    it('should include items from multiple columns', () => {
      mockProps = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'Col1 card', votes: 2 }
            }
          },
          col2: {
            cards: {
              card2: { content: 'Col2 card', votes: 7 }
            }
          }
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      const items = result.current.getSortedItemsForResults();

      expect(items).toHaveLength(2);
      expect(items[0].id).toBe('card2');
      expect(items[0].columnId).toBe('col2');
      expect(items[1].id).toBe('card1');
      expect(items[1].columnId).toBe('col1');
    });
  });
});
