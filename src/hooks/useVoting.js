import { ref, set } from 'firebase/database';
import { useCallback } from 'react';
import { database } from '../utils/firebase';

/**
 * Hook for voting operations across cards and groups.
 *
 * Handles vote counting, resetting, and group upvote/downvote with limit checks.
 *
 * @param {Object} params
 * @param {string|null} params.boardId - Current board ID
 * @param {Object|null} params.user - Current Firebase user
 * @param {Object} params.columns - Board columns data
 * @param {number} params.activeUsers - Number of active users
 * @param {number} params.votesPerUser - Votes allowed per user
 * @param {boolean} params.multipleVotesAllowed - Whether multiple votes are allowed
 * @param {boolean} params.retrospectiveMode - Whether retrospective mode is active
 * @returns {Object} Voting operations
 */
export const useVoting = ({
  boardId, user, columns, activeUsers,
  votesPerUser, multipleVotesAllowed, retrospectiveMode
}) => {
  // Calculate total votes across all cards and groups
  const getTotalVotes = useCallback(() => {
    let totalVotes = 0;

    Object.values(columns).forEach(column => {
      // Sum votes from all cards
      if (column.cards) {
        Object.values(column.cards).forEach(card => {
          totalVotes += card.votes || 0;
        });
      }

      // Sum votes from all groups
      if (column.groups) {
        Object.values(column.groups).forEach(group => {
          totalVotes += group.votes || 0;
        });
      }
    });

    return totalVotes;
  }, [columns]);

  // Calculate total votes cast by a specific user across all cards and groups
  const getUserVoteCount = useCallback((userId) => {
    if (!userId) return 0;
    
    let userVotes = 0;

    Object.values(columns).forEach(column => {
      // Count votes from all cards
      if (column.cards) {
        Object.values(column.cards).forEach(card => {
          if (card.voters && card.voters[userId]) {
            userVotes += Math.abs(card.voters[userId]); // Use absolute value to count both upvotes and downvotes
          }
        });
      }

      // Count votes from all groups
      if (column.groups) {
        Object.values(column.groups).forEach(group => {
          if (group.voters && group.voters[userId]) {
            userVotes += Math.abs(group.voters[userId]); // Use absolute value to count both upvotes and downvotes
          }
        });
      }
    });

    return userVotes;
  }, [columns]);

  // Calculate total votes remaining across all active users
  const getTotalVotesRemaining = useCallback(() => {
    if (!activeUsers || activeUsers === 0) return 0;
    
    const totalPossibleVotes = activeUsers * votesPerUser;
    const totalVotesCast = getTotalVotes();
    
    return Math.max(0, totalPossibleVotes - totalVotesCast);
  }, [activeUsers, votesPerUser, getTotalVotes]);

  // Reset all votes in the board
  const resetAllVotes = useCallback(() => {
    if (!boardId || !user) {
      return false;
    }

    // Confirm before proceeding
    const confirmMessage = 'Are you sure you want to reset all votes to zero? This cannot be undone.';
    if (!window.confirm(confirmMessage)) {
      return false;
    }

    // Loop through all columns and cards
    Object.entries(columns).forEach(([columnId, column]) => {
      if (column.cards) {
        Object.entries(column.cards).forEach(([cardId, card]) => {
          // Reset votes to 0 and clear all voters
          const cardRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}`);
          const updatedCard = { ...card, votes: 0, voters: {} };
          set(cardRef, updatedCard)
            .catch(error => {
              console.error(`Error resetting votes for card ${cardId}:`, error);
            });
        });
      }

      // Also reset group votes
      if (column.groups) {
        Object.entries(column.groups).forEach(([groupId, group]) => {
          // Reset group votes to 0 and clear all voters
          const groupRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}`);
          const updatedGroup = { ...group, votes: 0, voters: {} };
          set(groupRef, updatedGroup)
            .catch(error => {
              console.error(`Error resetting votes for group ${groupId}:`, error);
            });
        });
      }
    });

    return true;
  }, [boardId, user, columns]);

  // Upvote a group
  const upvoteGroup = useCallback((columnId, groupId, currentVotes = 0, showNotification) => {
    if (!boardId || !user) {
      return;
    }

    const currentGroup = columns[columnId]?.groups?.[groupId];
    if (!currentGroup) {
      return;
    }

    const currentVoters = currentGroup.voters || {};
    const userId = user.uid;

    // Check vote limit - skip if not in retrospective mode
    if (retrospectiveMode) {
      const currentUserVotes = getUserVoteCount(userId);
      
      // For multiple votes allowed, check if adding this vote would exceed the limit
      if (multipleVotesAllowed) {
        if (currentUserVotes >= votesPerUser) {
          showNotification(`You've reached your vote limit (${votesPerUser} votes)`);
          return;
        }
      } else {
        // For single votes, check if user has already cast the maximum votes
        const userCurrentVote = currentVoters[userId] || 0;
        if (userCurrentVote === 0 && currentUserVotes >= votesPerUser) {
          showNotification(`You've reached your vote limit (${votesPerUser} votes)`);
          return;
        }
      }
    }

    // Check if multiple votes are allowed
    if (!multipleVotesAllowed && currentVoters[userId] && currentVoters[userId] > 0) {
      showNotification('You have already voted on this group');
      return;
    }

    const newVotes = currentVotes + 1;
    const newVoters = {
      ...currentVoters,
      [userId]: (currentVoters[userId] || 0) + 1
    };

    const groupVotesRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/votes`);
    const groupVotersRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/voters`);

    Promise.all([
      set(groupVotesRef, newVotes),
      set(groupVotersRef, newVoters)
    ]).then(() => {
      showNotification('Upvoted group');
    }).catch(error => {
      console.error('Error updating group votes:', error);
    });
  }, [boardId, user, columns, retrospectiveMode, multipleVotesAllowed, votesPerUser, getUserVoteCount]);

  // Downvote a group
  const downvoteGroup = useCallback((columnId, groupId, currentVotes = 0, showNotification) => {
    if (!boardId || !user) {
      return;
    }

    const currentGroup = columns[columnId]?.groups?.[groupId];
    if (!currentGroup) {
      return;
    }

    const currentVoters = currentGroup.voters || {};
    const userId = user.uid;

    // Check if multiple votes are allowed
    if (!multipleVotesAllowed && currentVoters[userId] && currentVoters[userId] < 0) {
      showNotification('You have already voted on this group');
      return;
    }

    const newVotes = currentVotes - 1;
    const newVoters = {
      ...currentVoters,
      [userId]: (currentVoters[userId] || 0) - 1
    };

    const groupVotesRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/votes`);
    const groupVotersRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/voters`);

    Promise.all([
      set(groupVotesRef, newVotes),
      set(groupVotersRef, newVoters)
    ]).then(() => {
      showNotification('Downvoted group');
    }).catch(error => {
      console.error('Error updating group votes:', error);
    });
  }, [boardId, user, columns, multipleVotesAllowed]);

  return {
    resetAllVotes,
    getTotalVotes,
    getUserVoteCount,
    getTotalVotesRemaining,
    upvoteGroup,
    downvoteGroup
  };
};
