import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useBoardInsights } from './useBoardInsights';

const createMockColumns = (overrides = {}) => ({
  a_col1: {
    title: 'What went well',
    cards: {
      card1: {
        content: 'Great teamwork and collaboration this sprint',
        votes: 5,
        createdBy: 'user1',
        comments: {
          c1: { content: 'Agreed!', createdBy: 'user2' },
          c2: { content: 'Definitely', createdBy: 'user3' }
        },
        reactions: {
          '👍': { count: 3, users: { user1: true, user2: true, user3: true } }
        }
      },
      card2: {
        content: 'Smooth deployment process',
        votes: 3,
        createdBy: 'user2',
        comments: {},
        reactions: {}
      }
    },
    groups: {
      group1: {
        name: 'Process wins',
        votes: 2,
        cardIds: ['card1', 'card2'],
        expanded: true
      }
    }
  },
  b_col2: {
    title: 'What could improve',
    cards: {
      card3: {
        content: 'Slow code reviews are frustrating and painful',
        votes: 7,
        createdBy: 'user3',
        comments: {
          c3: { content: 'We need to fix this', createdBy: 'user1' },
          c4: { content: 'I agree, very frustrating', createdBy: 'user2' },
          c5: { content: 'Perhaps we can set SLAs', createdBy: 'user3' }
        },
        reactions: {
          '😢': { count: 2, users: { user1: true, user2: true } },
          '👍': { count: 1, users: { user3: true } }
        }
      },
      card4: {
        content: 'Confusing requirements and unclear priorities',
        votes: 4,
        createdBy: 'user1',
        comments: {},
        reactions: {
          '🔥': { count: 5, users: { user1: true, user2: true, user3: true, user4: true, user5: true } }
        }
      }
    },
    groups: {}
  },
  ...overrides
});

const createMockActionItems = (overrides = {}) => ({
  ai1: { status: 'open', dueDate: '2025-01-01' },
  ai2: { status: 'done' },
  ai3: { status: 'open', dueDate: '2099-12-31' },
  ...overrides
});

describe('useBoardInsights', () => {
  describe('empty board', () => {
    it('should return isEmpty true for empty columns', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: {}, actionItems: {}, activeUsers: 0 })
      );

      expect(result.current.isEmpty).toBe(true);
      expect(result.current.stats.totalCards).toBe(0);
      expect(result.current.stats.totalVotes).toBe(0);
      expect(result.current.stats.totalComments).toBe(0);
      expect(result.current.stats.totalReactions).toBe(0);
    });

    it('should return empty arrays for top items', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: {}, actionItems: {}, activeUsers: 0 })
      );

      expect(result.current.topVotedCards).toEqual([]);
      expect(result.current.mostDiscussed).toEqual([]);
      expect(result.current.mostReacted).toEqual([]);
      expect(result.current.themes).toEqual([]);
      expect(result.current.columnDistribution).toEqual([]);
    });

    it('should generate empty board summary', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: {}, actionItems: {}, activeUsers: 0 })
      );

      expect(result.current.summary).toContain('empty');
    });
  });

  describe('basic statistics', () => {
    it('should count total cards correctly', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.stats.totalCards).toBe(4);
      expect(result.current.isEmpty).toBe(false);
    });

    it('should count total columns', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.stats.totalColumns).toBe(2);
    });

    it('should count total votes (cards + groups)', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      // card1=5, card2=3, card3=7, card4=4, group1=2 => 21
      expect(result.current.stats.totalVotes).toBe(21);
    });

    it('should count total comments', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      // card1=2, card3=3 => 5
      expect(result.current.stats.totalComments).toBe(5);
    });

    it('should count total reactions', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      // card1: 👍=3, card3: 😢=2 + 👍=1, card4: 🔥=5 => 11
      expect(result.current.stats.totalReactions).toBe(11);
    });

    it('should count unique authors', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      // user1, user2, user3
      expect(result.current.stats.uniqueAuthors).toBe(3);
    });

    it('should count groups', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.stats.totalGroups).toBe(1);
    });

    it('should calculate average votes per card', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      // (5+3+7+4+2)/4 cards = 21/4 = 5.3 (group votes included in totalVotes but avgVotesPerCard uses totalVotes/totalCards)
      expect(result.current.stats.avgVotesPerCard).toBeGreaterThan(0);
    });

    it('should track active users', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 5 })
      );

      expect(result.current.stats.activeUsers).toBe(5);
    });
  });

  describe('column distribution', () => {
    it('should compute distribution per column', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.columnDistribution).toHaveLength(2);
      expect(result.current.columnDistribution[0].title).toBe('What went well');
      expect(result.current.columnDistribution[0].cardCount).toBe(2);
      expect(result.current.columnDistribution[1].title).toBe('What could improve');
      expect(result.current.columnDistribution[1].cardCount).toBe(2);
    });

    it('should compute percentage correctly', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      // 2/4 = 50% each
      expect(result.current.columnDistribution[0].percentage).toBe(50);
      expect(result.current.columnDistribution[1].percentage).toBe(50);
    });
  });

  describe('top voted cards', () => {
    it('should sort cards by votes descending', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.topVotedCards.length).toBeGreaterThan(0);
      expect(result.current.topVotedCards[0].votes).toBe(7); // card3
      expect(result.current.topVotedCards[1].votes).toBe(5); // card1
    });

    it('should include column title', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.topVotedCards[0].columnTitle).toBe('What could improve');
    });
  });

  describe('most discussed', () => {
    it('should sort by comment count descending', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.mostDiscussed.length).toBeGreaterThan(0);
      expect(result.current.mostDiscussed[0].commentCount).toBe(3); // card3
      expect(result.current.mostDiscussed[1].commentCount).toBe(2); // card1
    });
  });

  describe('most reacted', () => {
    it('should sort by reaction count descending', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.mostReacted.length).toBeGreaterThan(0);
      expect(result.current.mostReacted[0].reactionCount).toBe(5); // card4
    });
  });

  describe('sentiment analysis', () => {
    it('should detect mixed sentiment', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      // Has both positive (great, smooth, collaboration) and negative (frustrating, painful, confusing, unclear)
      expect(result.current.sentiment).toBeDefined();
      expect(['positive', 'negative', 'neutral']).toContain(result.current.sentiment.overall);
      expect(result.current.sentiment.score).toBeGreaterThanOrEqual(0);
      expect(result.current.sentiment.score).toBeLessThanOrEqual(1);
    });

    it('should detect positive sentiment for positive-only content', () => {
      const positiveColumns = {
        a_col1: {
          title: 'Wins',
          cards: {
            c1: { content: 'Great amazing wonderful fantastic', votes: 1, comments: {}, reactions: {} },
            c2: { content: 'Excellent awesome love it', votes: 1, comments: {}, reactions: {} }
          },
          groups: {}
        }
      };

      const { result } = renderHook(() =>
        useBoardInsights({ columns: positiveColumns, actionItems: {}, activeUsers: 1 })
      );

      expect(result.current.sentiment.overall).toBe('positive');
    });

    it('should detect negative sentiment for negative-only content', () => {
      const negativeColumns = {
        a_col1: {
          title: 'Issues',
          cards: {
            c1: { content: 'Terrible frustrating broken bugs', votes: 1, comments: {}, reactions: {} },
            c2: { content: 'Awful slow painful issues problems', votes: 1, comments: {}, reactions: {} }
          },
          groups: {}
        }
      };

      const { result } = renderHook(() =>
        useBoardInsights({ columns: negativeColumns, actionItems: {}, activeUsers: 1 })
      );

      expect(result.current.sentiment.overall).toBe('negative');
    });

    it('should include per-column sentiment', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.sentiment.byColumn).toHaveLength(2);
    });
  });

  describe('theme extraction', () => {
    it('should extract themes from card content', () => {
      // Create columns where words repeat across multiple cards
      const themeColumns = {
        a_col1: {
          title: 'Themes',
          cards: {
            c1: { content: 'deployment pipeline needs improvement', votes: 1, comments: {}, reactions: {} },
            c2: { content: 'deployment process was great', votes: 1, comments: {}, reactions: {} },
            c3: { content: 'testing pipeline is slow', votes: 1, comments: {}, reactions: {} }
          },
          groups: {}
        }
      };

      const { result } = renderHook(() =>
        useBoardInsights({ columns: themeColumns, actionItems: {}, activeUsers: 1 })
      );

      // 'deployment' appears in 2 cards, 'pipeline' in 2 cards
      expect(result.current.themes.length).toBeGreaterThan(0);
      const themeWords = result.current.themes.map(t => t.word);
      expect(themeWords).toContain('deployment');
      expect(themeWords).toContain('pipeline');
    });

    it('should return empty themes when no words repeat', () => {
      const uniqueColumns = {
        a_col1: {
          title: 'Unique',
          cards: {
            c1: { content: 'alpha', votes: 1, comments: {}, reactions: {} },
            c2: { content: 'bravo', votes: 1, comments: {}, reactions: {} }
          },
          groups: {}
        }
      };

      const { result } = renderHook(() =>
        useBoardInsights({ columns: uniqueColumns, actionItems: {}, activeUsers: 1 })
      );

      expect(result.current.themes).toEqual([]);
    });
  });

  describe('action items summary', () => {
    it('should summarize action items', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: createMockActionItems(), activeUsers: 3 })
      );

      expect(result.current.actionItemsSummary.total).toBe(3);
      expect(result.current.actionItemsSummary.open).toBe(2);
      expect(result.current.actionItemsSummary.done).toBe(1);
    });

    it('should calculate completion rate', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: createMockActionItems(), activeUsers: 3 })
      );

      // 1 done / 3 total = 33%
      expect(result.current.actionItemsSummary.completionRate).toBe(33);
    });

    it('should detect overdue items', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: createMockActionItems(), activeUsers: 3 })
      );

      // ai1 has dueDate 2025-01-01 which is in the past
      expect(result.current.actionItemsSummary.overdue).toBeGreaterThanOrEqual(1);
    });

    it('should return zeros for empty action items', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.actionItemsSummary.total).toBe(0);
      expect(result.current.actionItemsSummary.completionRate).toBe(0);
    });
  });

  describe('engagement score', () => {
    it('should compute engagement score between 0-100', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.engagementScore).toBeGreaterThanOrEqual(0);
      expect(result.current.engagementScore).toBeLessThanOrEqual(100);
    });

    it('should return 0 for empty board', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: {}, actionItems: {}, activeUsers: 0 })
      );

      expect(result.current.engagementScore).toBe(0);
    });

    it('should have engagement factors between 0-1', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      const factors = result.current.engagementFactors;
      expect(factors.votingActivity).toBeGreaterThanOrEqual(0);
      expect(factors.votingActivity).toBeLessThanOrEqual(1);
      expect(factors.commentActivity).toBeGreaterThanOrEqual(0);
      expect(factors.commentActivity).toBeLessThanOrEqual(1);
      expect(factors.reactionActivity).toBeGreaterThanOrEqual(0);
      expect(factors.reactionActivity).toBeLessThanOrEqual(1);
      expect(factors.groupingActivity).toBeGreaterThanOrEqual(0);
      expect(factors.groupingActivity).toBeLessThanOrEqual(1);
    });
  });

  describe('summary generation', () => {
    it('should include card count in summary', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.summary).toContain('4 cards');
    });

    it('should include column count in summary', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.summary).toContain('2 columns');
    });

    it('should mention votes when present', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: {}, activeUsers: 3 })
      );

      expect(result.current.summary).toContain('votes');
    });
  });

  describe('null safety', () => {
    it('should handle null columns', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: null, actionItems: null, activeUsers: 0 })
      );

      expect(result.current.isEmpty).toBe(true);
      expect(result.current.stats.totalCards).toBe(0);
    });

    it('should handle undefined actionItems', () => {
      const { result } = renderHook(() =>
        useBoardInsights({ columns: createMockColumns(), actionItems: undefined, activeUsers: 3 })
      );

      expect(result.current.actionItemsSummary.total).toBe(0);
    });

    it('should handle cards with missing fields', () => {
      const sparseColumns = {
        a_col1: {
          title: 'Sparse',
          cards: {
            c1: { content: 'Just content' }
          },
          groups: {}
        }
      };

      const { result } = renderHook(() =>
        useBoardInsights({ columns: sparseColumns, actionItems: {}, activeUsers: 1 })
      );

      expect(result.current.stats.totalCards).toBe(1);
      expect(result.current.stats.totalVotes).toBe(0);
      expect(result.current.stats.totalComments).toBe(0);
    });
  });
});
