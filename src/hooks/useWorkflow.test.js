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
  ...overrides
});

describe('useWorkflow', () => {
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Phase Transitions', () => {
    it('should call updateBoardSettings with GROUPING and retrospectiveMode true for startGroupingPhase', () => {
      mockProps = createMockProps();
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.startGroupingPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.GROUPING,
        retrospectiveMode: true
      });
    });

    it('should call updateBoardSettings with INTERACTIONS for startInteractionsPhase', () => {
      mockProps = createMockProps();
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.startInteractionsPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.INTERACTIONS
      });
    });

    it('should call updateBoardSettings with RESULTS and resultsViewIndex 0 for startResultsPhase', () => {
      mockProps = createMockProps();
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.startResultsPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.RESULTS,
        resultsViewIndex: 0
      });
    });

    it('should call updateBoardSettings with POLL for startPollPhase', () => {
      mockProps = createMockProps();
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.startPollPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.POLL
      });
    });

    it('should call updateBoardSettings with POLL_RESULTS for startPollResultsPhase', () => {
      mockProps = createMockProps();
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.startPollResultsPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.POLL_RESULTS
      });
    });

    it('should call updateBoardSettings with CREATION, retrospectiveMode false, and resultsViewIndex 0 for goToCreationPhase', () => {
      mockProps = createMockProps();
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.goToCreationPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.CREATION,
        retrospectiveMode: false,
        resultsViewIndex: 0
      });
    });

    it('should call updateBoardSettings with HEALTH_CHECK for startHealthCheckPhase', () => {
      mockProps = createMockProps();
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.startHealthCheckPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.HEALTH_CHECK
      });
    });

    it('should call updateBoardSettings with HEALTH_CHECK_RESULTS for startHealthCheckResultsPhase', () => {
      mockProps = createMockProps();
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.startHealthCheckResultsPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.HEALTH_CHECK_RESULTS
      });
    });
  });

  describe('goToPreviousPhase', () => {
    it('should go from CREATION to HEALTH_CHECK', () => {
      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.CREATION
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.goToPreviousPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.HEALTH_CHECK
      });
    });

    it('should go from GROUPING to CREATION when no groups exist', () => {
      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.GROUPING,
        columns: {
          col1: { cards: {}, groups: {} },
          col2: { cards: {} }
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.goToPreviousPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.CREATION
      });
    });

    it('should remove groups then go to CREATION from GROUPING when groups exist and user confirms', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.GROUPING,
        columns: {
          col1: { cards: {}, groups: { group1: { name: 'Group 1' } } }
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      await act(async () => {
        result.current.goToPreviousPhase();
      });

      expect(window.confirm).toHaveBeenCalled();
      expect(mockProps.removeAllGrouping).toHaveBeenCalled();
      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.CREATION
      });

      window.confirm.mockRestore();
    });

    it('should not change phase from GROUPING when groups exist and user cancels', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.GROUPING,
        columns: {
          col1: { cards: {}, groups: { group1: { name: 'Group 1' } } }
        }
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.goToPreviousPhase();
      });

      expect(window.confirm).toHaveBeenCalled();
      expect(mockProps.removeAllGrouping).not.toHaveBeenCalled();
      expect(mockProps.updateBoardSettings).not.toHaveBeenCalled();

      window.confirm.mockRestore();
    });

    it('should go from INTERACTIONS to GROUPING', () => {
      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.INTERACTIONS
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.goToPreviousPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.GROUPING
      });
    });

    it('should go from RESULTS to INTERACTIONS', () => {
      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.RESULTS
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.goToPreviousPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.INTERACTIONS
      });
    });

    it('should go from POLL to RESULTS', () => {
      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.POLL
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.goToPreviousPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.RESULTS
      });
    });

    it('should go from POLL_RESULTS to POLL', () => {
      mockProps = createMockProps({
        workflowPhase: WORKFLOW_PHASES.POLL_RESULTS
      });
      const { result } = renderHook(() => useWorkflow(mockProps));

      act(() => {
        result.current.goToPreviousPhase();
      });

      expect(mockProps.updateBoardSettings).toHaveBeenCalledWith({
        workflowPhase: WORKFLOW_PHASES.POLL
      });
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
