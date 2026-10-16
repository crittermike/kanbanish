import { ref, set } from 'firebase/database';
import { useCallback } from 'react';
import { database } from '../utils/firebase';

/**
 * Hook for poll functionality (retrospective effectiveness rating).
 *
 * @param {Object} params
 * @param {string|null} params.boardId - Current board ID
 * @param {Object|null} params.user - Current Firebase user
 * @param {Object} params.pollVotes - All poll votes keyed by userId
 * @param {Function} params.setUserPollVote - Setter for current user's poll vote
 * @returns {Object} Poll operations
 */
export const usePoll = ({ boardId, user, pollVotes, setUserPollVote }) => {
  const submitPollVote = useCallback((rating) => {
    if (!boardId || !user || rating < 1 || rating > 5) {
      return;
    }

    const pollRef = ref(database, `boards/${boardId}/poll/votes/${user.uid}`);
    set(pollRef, rating).then(() => {
      setUserPollVote(rating);
    }).catch(error => {
      console.error('Error submitting poll vote:', error);
    });
  }, [boardId, user, setUserPollVote]);

  const getPollStats = useCallback(() => {
    const votes = Object.values(pollVotes);
    if (votes.length === 0) {
      return { average: 0, distribution: [0, 0, 0, 0, 0], totalVotes: 0 };
    }

    const distribution = [0, 0, 0, 0, 0]; // Index 0 = rating 1, Index 4 = rating 5
    let sum = 0;

    votes.forEach(vote => {
      if (vote >= 1 && vote <= 5) {
        distribution[vote - 1]++;
        sum += vote;
      }
    });

    const average = sum / votes.length;
    return { average, distribution, totalVotes: votes.length };
  }, [pollVotes]);

  return { submitPollVote, getPollStats };
};
