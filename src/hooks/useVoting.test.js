import { renderHook, act } from '@testing-library/react';
import { set } from 'firebase/database';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useVoting } from './useVoting';

// Mock Firebase
vi.mock('../utils/firebase', () => ({
  database: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve())
}));
// Mock the NotificationContext
const { mockShowNotification } = vi.hoisted(() => ({
  mockShowNotification: vi.fn()
}));
vi.mock('../context/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
    notification: { message: '', show: false }
  }),
  NotificationProvider: ({ children }) => children
}));


const createMockProps = (overrides = {}) => ({
  boardId: 'board-123',
  user: { uid: 'user1' },
  columns: {},
  activeUsers: 3,
  votesPerUser: 5,
  multipleVotesAllowed: false,
  retrospectiveMode: false,
  ...overrides
});

describe('useVoting', () => {
  let mockProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps = createMockProps();
  });

  describe('getTotalVotes', () => {
    it('should return 0 for empty columns', () => {
      const { result } = renderHook(() => useVoting(mockProps));
      expect(result.current.getTotalVotes()).toBe(0);
    });

    it('should sum votes from cards', () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { votes: 3 },
              card2: { votes: 2 }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getTotalVotes()).toBe(5);
    });

    it('should sum votes from groups', () => {
      const props = createMockProps({
        columns: {
          col1: {
            groups: {
              group1: { votes: 4 },
              group2: { votes: 1 }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getTotalVotes()).toBe(5);
    });

    it('should sum votes from both cards and groups across columns', () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: { card1: { votes: 2 } },
            groups: { group1: { votes: 3 } }
          },
          col2: {
            cards: { card2: { votes: 1 } },
            groups: { group2: { votes: 4 } }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getTotalVotes()).toBe(10);
    });

    it('should treat missing votes as 0', () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: { card1: {} },
            groups: { group1: {} }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getTotalVotes()).toBe(0);
    });

    it('should handle columns with no cards or groups', () => {
      const props = createMockProps({
        columns: {
          col1: {}
        }
      });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getTotalVotes()).toBe(0);
    });
  });

  describe('getUserVoteCount', () => {
    it('should return 0 when userId is null', () => {
      const { result } = renderHook(() => useVoting(mockProps));
      expect(result.current.getUserVoteCount(null)).toBe(0);
    });

    it('should return 0 when userId is undefined', () => {
      const { result } = renderHook(() => useVoting(mockProps));
      expect(result.current.getUserVoteCount(undefined)).toBe(0);
    });

    it('should return 0 when no votes exist', () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: { card1: { voters: {} } }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getUserVoteCount('user1')).toBe(0);
    });

    it('should count votes on cards for a user', () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { voters: { user1: 1 } },
              card2: { voters: { user1: 1 } }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getUserVoteCount('user1')).toBe(2);
    });

    it('should count votes on groups for a user', () => {
      const props = createMockProps({
        columns: {
          col1: {
            groups: {
              group1: { voters: { user1: 1 } },
              group2: { voters: { user1: 1 } }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getUserVoteCount('user1')).toBe(2);
    });

    it('should use absolute value for downvotes', () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { voters: { user1: -1 } },
              card2: { voters: { user1: 1 } }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getUserVoteCount('user1')).toBe(2);
    });

    it('should count votes across cards and groups', () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: { card1: { voters: { user1: 1 } } },
            groups: { group1: { voters: { user1: -1 } } }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getUserVoteCount('user1')).toBe(2);
    });

    it('should not count other users votes', () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { voters: { user1: 1, user2: 1 } }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getUserVoteCount('user1')).toBe(1);
    });

    it('should handle cards without voters property', () => {
      const props = createMockProps({
        columns: {
          col1: {
            cards: { card1: { votes: 3 } }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getUserVoteCount('user1')).toBe(0);
    });
  });

  describe('getTotalVotesRemaining', () => {
    it('should return 0 when activeUsers is 0', () => {
      const props = createMockProps({ activeUsers: 0 });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getTotalVotesRemaining()).toBe(0);
    });

    it('should return 0 when activeUsers is null', () => {
      const props = createMockProps({ activeUsers: null });
      const { result } = renderHook(() => useVoting(props));
      expect(result.current.getTotalVotesRemaining()).toBe(0);
    });

    it('should calculate remaining votes correctly', () => {
      const props = createMockProps({
        activeUsers: 3,
        votesPerUser: 5,
        columns: {}
      });
      const { result } = renderHook(() => useVoting(props));
      // 3 users * 5 votes = 15 total, 0 cast = 15 remaining
      expect(result.current.getTotalVotesRemaining()).toBe(15);
    });

    it('should subtract cast votes from total', () => {
      const props = createMockProps({
        activeUsers: 2,
        votesPerUser: 5,
        columns: {
          col1: {
            cards: { card1: { votes: 3 } }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));
      // 2 users * 5 votes = 10 total, 3 cast = 7 remaining
      expect(result.current.getTotalVotesRemaining()).toBe(7);
    });

    it('should never return negative remaining votes', () => {
      const props = createMockProps({
        activeUsers: 1,
        votesPerUser: 2,
        columns: {
          col1: {
            cards: { card1: { votes: 10 } }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));
      // 1 * 2 = 2 total, 10 cast => max(0, -8) = 0
      expect(result.current.getTotalVotesRemaining()).toBe(0);
    });
  });

  describe('resetAllVotes', () => {
    it('should return false when boardId is null', () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useVoting(props));

      const returned = result.current.resetAllVotes();
      expect(returned).toBe(false);
      expect(set).not.toHaveBeenCalled();
    });

    it('should return false when user is null', () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useVoting(props));

      const returned = result.current.resetAllVotes();
      expect(returned).toBe(false);
      expect(set).not.toHaveBeenCalled();
    });

    it('should return false when user cancels confirm dialog', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      const props = createMockProps({
        columns: {
          col1: {
            cards: { card1: { votes: 3, voters: { user1: 3 } } }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));

      const returned = result.current.resetAllVotes();
      expect(returned).toBe(false);
      expect(set).not.toHaveBeenCalled();

      window.confirm.mockRestore();
    });

    it('should reset card votes when user confirms', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const props = createMockProps({
        columns: {
          col1: {
            cards: {
              card1: { content: 'test', votes: 3, voters: { user1: 3 } }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));

      const returned = result.current.resetAllVotes();
      expect(returned).toBe(true);
      expect(set).toHaveBeenCalledWith('mock-ref', {
        content: 'test',
        votes: 0,
        voters: {}
      });

      window.confirm.mockRestore();
    });

    it('should reset group votes when user confirms', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const props = createMockProps({
        columns: {
          col1: {
            groups: {
              group1: { name: 'Group 1', votes: 5, voters: { user1: 5 } }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));

      const returned = result.current.resetAllVotes();
      expect(returned).toBe(true);
      expect(set).toHaveBeenCalledWith('mock-ref', {
        name: 'Group 1',
        votes: 0,
        voters: {}
      });

      window.confirm.mockRestore();
    });

    it('should reset both card and group votes across all columns', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const props = createMockProps({
        columns: {
          col1: {
            cards: { card1: { votes: 2, voters: { user1: 2 } } },
            groups: { group1: { votes: 3, voters: { user1: 3 } } }
          },
          col2: {
            cards: { card2: { votes: 1, voters: { user2: 1 } } }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));

      const returned = result.current.resetAllVotes();
      expect(returned).toBe(true);
      // 3 calls: card1 + group1 + card2
      expect(set).toHaveBeenCalledTimes(3);

      window.confirm.mockRestore();
    });

    it('should call window.confirm with the correct message', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      const { result } = renderHook(() => useVoting(mockProps));
      result.current.resetAllVotes();

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to reset all votes to zero? This cannot be undone.'
      );

      window.confirm.mockRestore();
    });

    it('should handle columns with no cards or groups', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const props = createMockProps({
        columns: { col1: {} }
      });
      const { result } = renderHook(() => useVoting(props));

      const returned = result.current.resetAllVotes();
      expect(returned).toBe(true);
      expect(set).not.toHaveBeenCalled();

      window.confirm.mockRestore();
    });
  });

  describe('upvoteGroup', () => {
    it('should upvote a group', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            groups: {
              group1: { votes: 0, voters: {} }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.upvoteGroup('col1', 'group1', 0);
      });

      expect(set).toHaveBeenCalledTimes(2); // votes ref + voters ref
      expect(mockShowNotification).toHaveBeenCalledWith('Upvoted group');
    });

    it('should not upvote when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.upvoteGroup('col1', 'group1', 0);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should not upvote when user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.upvoteGroup('col1', 'group1', 0);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should not upvote when group is not found', async () => {
      const props = createMockProps({
        columns: { col1: { groups: {} } }
      });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.upvoteGroup('col1', 'nonexistent', 0);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should block duplicate vote in single-vote mode', async () => {
      const props = createMockProps({
        multipleVotesAllowed: false,
        columns: {
          col1: {
            groups: {
              group1: { votes: 1, voters: { user1: 1 } }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.upvoteGroup('col1', 'group1', 1);
      });

      expect(mockShowNotification).toHaveBeenCalledWith('You have already voted on this group');
      expect(set).not.toHaveBeenCalled();
    });

    it('should enforce vote limit in retrospective mode', async () => {
      const props = createMockProps({
        retrospectiveMode: true,
        votesPerUser: 3,
        multipleVotesAllowed: true,
        columns: {
          col1: {
            cards: {
              card1: { voters: { user1: 1 } },
              card2: { voters: { user1: 1 } },
              card3: { voters: { user1: 1 } }
            },
            groups: {
              group1: { votes: 0, voters: {} }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.upvoteGroup('col1', 'group1', 0);
      });

      expect(mockShowNotification).toHaveBeenCalledWith("You've reached your vote limit (3 votes)");
      expect(set).not.toHaveBeenCalled();
    });

    it('should enforce vote limit in retrospective mode with single vote', async () => {
      const props = createMockProps({
        retrospectiveMode: true,
        votesPerUser: 2,
        multipleVotesAllowed: false,
        columns: {
          col1: {
            cards: {
              card1: { voters: { user1: 1 } },
              card2: { voters: { user1: 1 } }
            },
            groups: {
              group1: { votes: 0, voters: {} }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.upvoteGroup('col1', 'group1', 0);
      });

      expect(mockShowNotification).toHaveBeenCalledWith("You've reached your vote limit (2 votes)");
      expect(set).not.toHaveBeenCalled();
    });

    it('should allow vote when multipleVotesAllowed and under limit', async () => {
      const props = createMockProps({
        multipleVotesAllowed: true,
        retrospectiveMode: true,
        votesPerUser: 5,
        columns: {
          col1: {
            groups: {
              group1: { votes: 1, voters: { user1: 1 } }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.upvoteGroup('col1', 'group1', 1);
      });

      expect(set).toHaveBeenCalledTimes(2);
      expect(mockShowNotification).toHaveBeenCalledWith('Upvoted group');
    });

    it('should skip vote limit check when not in retrospective mode', async () => {
      const props = createMockProps({
        retrospectiveMode: false,
        multipleVotesAllowed: true,
        votesPerUser: 1,
        columns: {
          col1: {
            cards: { card1: { voters: { user1: 1 } } },
            groups: {
              group1: { votes: 0, voters: {} }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.upvoteGroup('col1', 'group1', 0);
      });

      expect(set).toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith('Upvoted group');
    });
  });

  describe('downvoteGroup', () => {
    it('should downvote a group', async () => {
      const props = createMockProps({
        columns: {
          col1: {
            groups: {
              group1: { votes: 1, voters: {} }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.downvoteGroup('col1', 'group1', 1);
      });

      expect(set).toHaveBeenCalledTimes(2);
      expect(mockShowNotification).toHaveBeenCalledWith('Downvoted group');
    });

    it('should not downvote when boardId is null', async () => {
      const props = createMockProps({ boardId: null });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.downvoteGroup('col1', 'group1', 1);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should not downvote when user is null', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.downvoteGroup('col1', 'group1', 1);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should not downvote when group is not found', async () => {
      const props = createMockProps({
        columns: { col1: { groups: {} } }
      });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.downvoteGroup('col1', 'nonexistent', 1);
      });

      expect(set).not.toHaveBeenCalled();
    });

    it('should block duplicate negative vote in single-vote mode', async () => {
      const props = createMockProps({
        multipleVotesAllowed: false,
        columns: {
          col1: {
            groups: {
              group1: { votes: -1, voters: { user1: -1 } }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.downvoteGroup('col1', 'group1', -1);
      });

      expect(mockShowNotification).toHaveBeenCalledWith('You have already voted on this group');
      expect(set).not.toHaveBeenCalled();
    });

    it('should allow multiple downvotes when multipleVotesAllowed', async () => {
      const props = createMockProps({
        multipleVotesAllowed: true,
        columns: {
          col1: {
            groups: {
              group1: { votes: -1, voters: { user1: -1 } }
            }
          }
        }
      });
      const { result } = renderHook(() => useVoting(props));

      await act(async () => {
        result.current.downvoteGroup('col1', 'group1', -1);
      });

      expect(set).toHaveBeenCalledTimes(2);
      expect(mockShowNotification).toHaveBeenCalledWith('Downvoted group');
    });
  });
});
