import { renderHook, act } from '@testing-library/react';
import { ref, set, remove } from 'firebase/database';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useGroups } from './useGroups';

// Mock Firebase
vi.mock('../utils/firebase', () => ({
  database: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve())
}));

vi.mock('../utils/ids', () => ({
  generateId: vi.fn(() => 'mock-group-id')
}));

const createMockProps = (overrides = {}) => ({
  boardId: 'board-123',
  user: { uid: 'user1' },
  columns: {},
  ...overrides
});

describe('useGroups', () => {
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps = createMockProps();
  });

  describe('moveCard', () => {
    it('should do nothing when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.moveCard('card1', 'col1', 'col2');
      });

      expect(set).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
    });

    it('should do nothing when user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.moveCard('card1', 'col1', 'col2');
      });

      expect(set).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
    });

    it('should do nothing when card is not found', async () => {
      const props = createMockProps({
        columns: {
          col1: { cards: {} }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.moveCard('nonexistent', 'col1', 'col1');
      });

      expect(set).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
    });

    it('should do nothing when moving to same group state within same column', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'test', groupId: 'group1' }
            },
            groups: {
              group1: { cardIds: ['card1'] }
            }
          }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.moveCard('card1', 'col1', 'col1', 'group1');
      });

      expect(set).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
    });

    it('should add card to group within same column', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'test' }
            },
            groups: {
              group1: { cardIds: [] }
            }
          }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.moveCard('card1', 'col1', 'col1', 'group1');
      });

      // set groupId on card + update group cardIds
      expect(set).toHaveBeenCalledTimes(2);
    });

    it('should remove card from group within same column', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'test', groupId: 'group1' }
            },
            groups: {
              group1: { cardIds: ['card1'] }
            }
          }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.moveCard('card1', 'col1', 'col1', null);
      });

      // remove groupId from card + update source group cardIds
      expect(remove).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledTimes(1);
    });

    it('should move card between columns without group', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'test', votes: 2 }
            }
          },
          col2: {
            cards: {}
          }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.moveCard('card1', 'col1', 'col2');
      });

      // remove from source + set in target
      expect(remove).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledTimes(1);
    });

    it('should move card between columns into a group', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'test' }
            }
          },
          col2: {
            cards: {},
            groups: {
              group1: { cardIds: ['card2'] }
            }
          }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.moveCard('card1', 'col1', 'col2', 'group1');
      });

      // remove from source + set in target (with groupId) + update group cardIds
      expect(remove).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledTimes(2);
    });

    it('should move card between columns and remove from source group', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'test', groupId: 'group1' }
            },
            groups: {
              group1: { cardIds: ['card1', 'card2'] }
            }
          },
          col2: {
            cards: {}
          }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.moveCard('card1', 'col1', 'col2');
      });

      // remove source card + set target card + update source group cardIds
      expect(remove).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledTimes(2);
    });

    it('should strip groupId when moving between columns without target group', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'test', groupId: 'group1' }
            },
            groups: {
              group1: { cardIds: ['card1'] }
            }
          },
          col2: { cards: {} }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.moveCard('card1', 'col1', 'col2', null);
      });

      // The card should be written without groupId
      expect(set).toHaveBeenCalled();
      // Verify the set call for the target card does NOT include groupId
      const setCall = set.mock.calls.find(call => {
        const arg = call[1];
        return typeof arg === 'object' && arg !== null && 'content' in arg;
      });
      expect(setCall).toBeDefined();
      expect(setCall[1]).not.toHaveProperty('groupId');
    });

    it('should not duplicate cardId when adding to group that already has it', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'test' }
            },
            groups: {
              group1: { cardIds: ['card1'] }
            }
          }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.moveCard('card1', 'col1', 'col1', 'group1');
      });

      // Should set groupId on card but NOT update cardIds (already includes card1)
      expect(set).toHaveBeenCalledTimes(1);
    });
  });

  describe('createCardGroup', () => {
    it('should create a group with provided cards', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'A' },
              card2: { content: 'B' }
            }
          }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.createCardGroup('col1', ['card1', 'card2']);
      });

      // set group data + set groupId on card1 + set groupId on card2
      expect(set).toHaveBeenCalledTimes(3);
    });

    it('should do nothing when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.createCardGroup('col1', ['card1']);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should do nothing when user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.createCardGroup('col1', ['card1']);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should do nothing when cardIds is empty', async () => {
      const { result } = renderHook(() => useGroups(mockProps));

      await act(async () => {
        result.current.createCardGroup('col1', []);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should use custom group name', async () => {
      const { result } = renderHook(() => useGroups(mockProps));

      await act(async () => {
        result.current.createCardGroup('col1', ['card1'], 'Custom Name');
      });

      // Find the group data set call (the one with an object containing 'name')
      const groupDataCall = set.mock.calls.find(call =>
        typeof call[1] === 'object' && call[1] !== null && 'name' in call[1]
      );
      expect(groupDataCall[1]).toMatchObject({
        name: 'Custom Name',
        expanded: true,
        votes: 0,
        voters: {},
        cardIds: ['card1']
      });
    });

    it('should use default group name when none provided', async () => {
      const { result } = renderHook(() => useGroups(mockProps));

      await act(async () => {
        result.current.createCardGroup('col1', ['card1']);
      });

      const groupDataCall = set.mock.calls.find(call =>
        typeof call[1] === 'object' && call[1] !== null && 'name' in call[1]
      );
      expect(groupDataCall[1]).toMatchObject({
        name: 'New Group'
      });
    });

    it('should use targetCreatedTime when provided', async () => {
      const { result } = renderHook(() => useGroups(mockProps));
      const customTime = 999999;

      await act(async () => {
        result.current.createCardGroup('col1', ['card1'], 'Group', customTime);
      });

      const groupDataCall = set.mock.calls.find(call =>
        typeof call[1] === 'object' && call[1] !== null && 'created' in call[1]
      );
      expect(groupDataCall[1]).toMatchObject({
        created: customTime
      });
    });

    it('should set groupId on each card', async () => {
      const { result } = renderHook(() => useGroups(mockProps));

      await act(async () => {
        result.current.createCardGroup('col1', ['card1', 'card2', 'card3']);
      });

      // 1 for group data + 3 for card groupIds
      expect(set).toHaveBeenCalledTimes(4);
      // Card groupId calls should set 'mock-group-id'
      expect(set).toHaveBeenCalledWith('mock-ref', 'mock-group-id');
    });
  });

  describe('ungroupCards', () => {
    it('should ungroup cards and remove the group', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            groups: {
              group1: { name: 'G1', cardIds: ['card1', 'card2'] }
            }
          }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.ungroupCards('col1', 'group1');
      });

      // remove groupId from card1 + remove groupId from card2 + remove group
      expect(remove).toHaveBeenCalledTimes(3);
    });

    it('should do nothing when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.ungroupCards('col1', 'group1');
      });

      expect(remove).not.toHaveBeenCalled();
    });

    it('should do nothing when user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.ungroupCards('col1', 'group1');
      });

      expect(remove).not.toHaveBeenCalled();
    });

    it('should do nothing when group is not found', async () => {
      const props = createMockProps({
        columns: {
          col1: { groups: {} }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.ungroupCards('col1', 'nonexistent');
      });

      expect(remove).not.toHaveBeenCalled();
    });

    it('should do nothing when group has no cardIds', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            groups: {
              group1: { name: 'G1' }
            }
          }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.ungroupCards('col1', 'group1');
      });

      expect(remove).not.toHaveBeenCalled();
    });
  });

  describe('removeAllGrouping', () => {
    it('should remove all groups and card groupIds across columns', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            groups: {
              group1: { cardIds: ['card1', 'card2'] }
            }
          },
          col2: {
            groups: {
              group2: { cardIds: ['card3'] }
            }
          }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        await result.current.removeAllGrouping();
      });

      // card1 groupId + card2 groupId + group1 + card3 groupId + group2
      expect(remove).toHaveBeenCalledTimes(5);
    });

    it('should do nothing when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        await result.current.removeAllGrouping();
      });

      expect(remove).not.toHaveBeenCalled();
    });

    it('should do nothing when user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        await result.current.removeAllGrouping();
      });

      expect(remove).not.toHaveBeenCalled();
    });

    it('should handle columns without groups', async () => {
      const props = createMockProps({
        columns: {
          col1: { cards: { card1: { content: 'test' } } },
          col2: {}
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        await result.current.removeAllGrouping();
      });

      expect(remove).not.toHaveBeenCalled();
    });

    it('should handle groups without cardIds', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            groups: {
              group1: { name: 'G1' }
            }
          }
        }
      });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        await result.current.removeAllGrouping();
      });

      // Only group removal, no card updates
      expect(remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateGroupName', () => {
    it('should update the group name via Firebase set()', async () => {
      const { result } = renderHook(() => useGroups(mockProps));

      await act(async () => {
        result.current.updateGroupName('col1', 'group1', 'Renamed Group');
      });

      expect(ref).toHaveBeenCalled();
      expect(set).toHaveBeenCalledWith('mock-ref', 'Renamed Group');
    });

    it('should do nothing when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.updateGroupName('col1', 'group1', 'New Name');
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should do nothing when user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.updateGroupName('col1', 'group1', 'New Name');
      });

      expect(set).not.toHaveBeenCalled();
    });
  });

  describe('toggleGroupExpanded', () => {
    it('should set expanded to true via Firebase set()', async () => {
      const { result } = renderHook(() => useGroups(mockProps));

      await act(async () => {
        result.current.toggleGroupExpanded('col1', 'group1', true);
      });

      expect(ref).toHaveBeenCalled();
      expect(set).toHaveBeenCalledWith('mock-ref', true);
    });

    it('should set expanded to false via Firebase set()', async () => {
      const { result } = renderHook(() => useGroups(mockProps));

      await act(async () => {
        result.current.toggleGroupExpanded('col1', 'group1', false);
      });

      expect(set).toHaveBeenCalledWith('mock-ref', false);
    });

    it('should do nothing when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.toggleGroupExpanded('col1', 'group1', true);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should do nothing when user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useGroups(props));

      await act(async () => {
        result.current.toggleGroupExpanded('col1', 'group1', true);
      });

      expect(set).not.toHaveBeenCalled();
    });
  });
});
