import { describe, expect, it } from 'vitest';
import { determineVoteChange, calculateNewUserVote } from './voteHelpers';

describe('Vote Helper Functions', () => {
  describe('determineVoteChange', () => {
    it('prevents negative total votes', () => {
      const result = determineVoteChange({
        userCurrentVote: 0,
        requestedDelta: -1,
        multipleVotesAllowed: false,
        currentTotalVotes: 0
      });
      
      expect(result.shouldReturn).toBe(true);
      expect(result.message).toBe("Can't have negative votes");
    });

    it('prevents voting in the same direction when multiple votes are not allowed', () => {
      const result = determineVoteChange({
        userCurrentVote: 1,
        requestedDelta: 1,
        multipleVotesAllowed: false,
        currentTotalVotes: 5
      });
      
      expect(result.shouldReturn).toBe(true);
      expect(result.message).toBe("You've already voted");
    });

    it('resets vote when voting in opposite direction with single votes', () => {
      const result = determineVoteChange({
        userCurrentVote: 1,
        requestedDelta: -1,
        multipleVotesAllowed: false,
        currentTotalVotes: 5
      });
      
      expect(result.delta).toBe(-1); // Cancels the previous upvote
      expect(result.isVoteRemoval).toBe(true);
      expect(result.message).toBe("Vote removed");
    });

    it('allows new vote when user has not voted before', () => {
      const result = determineVoteChange({
        userCurrentVote: 0,
        requestedDelta: 1,
        multipleVotesAllowed: false,
        currentTotalVotes: 5
      });
      
      expect(result.delta).toBe(1);
      expect(result.isVoteRemoval).toBe(false);
      expect(result.message).toBe("Upvoted card");
    });

    it('allows multiple votes in the same direction when enabled', () => {
      const result = determineVoteChange({
        userCurrentVote: 1,
        requestedDelta: 1,
        multipleVotesAllowed: true,
        currentTotalVotes: 5
      });
      
      expect(result.delta).toBe(1);
      expect(result.isVoteRemoval).toBe(false);
      expect(result.message).toBe("Upvoted card");
    });
  });

  describe('calculateNewUserVote', () => {
    it('increments votes when multiple votes are allowed', () => {
      const result = calculateNewUserVote({
        userCurrentVote: 2,
        delta: 1,
        multipleVotesAllowed: true
      });
      
      expect(result).toBe(3);
    });

    it('sets vote to zero when toggling an existing vote with single votes', () => {
      const result = calculateNewUserVote({
        userCurrentVote: 1,
        delta: -1, // Canceling previous vote
        multipleVotesAllowed: false
      });
      
      expect(result).toBe(0);
    });

    it('sets vote to new direction when no previous vote with single votes', () => {
      const result = calculateNewUserVote({
        userCurrentVote: 0,
        delta: 1,
        multipleVotesAllowed: false
      });
      
      expect(result).toBe(1);
    });
  });
});