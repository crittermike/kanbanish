import { useCallback } from 'react';
import { ref, set, remove } from 'firebase/database';
import { database } from '../utils/firebase';

export function useCardVoting({ 
  boardId, 
  columnId, 
  cardId, 
  cardData, 
  user, 
  showNotification,
  multipleVotesAllowed = false
}) {
  // Voting operations
  const updateVotes = useCallback(async (delta, e, message) => {
    e.stopPropagation();
    
    if (!boardId || !user) return;
    
    const currentVotes = cardData.votes || 0;
    
    // Prevent negative votes
    if (delta < 0 && currentVotes <= 0) {
      showNotification("Can't have negative votes");
      return;
    }
    
    // Get the user's current vote if any
    const userCurrentVote = cardData.voters && cardData.voters[user.uid] ? cardData.voters[user.uid] : 0;
    
    // If multiple votes are not allowed
    if (!multipleVotesAllowed) {
      // If the user is trying to vote in the same direction they already voted
      if (userCurrentVote === delta) {
        showNotification("You've already voted");
        return;
      }
      
      // If the user already voted and is now voting in opposite direction,
      // just reset their vote (remove previous vote, don't add new one)
      if (userCurrentVote !== 0) {
        // Cancel their previous vote only
        delta = -userCurrentVote;
      }
    }
    
    try {
      const newVotes = currentVotes + delta;
      
      // Update the total vote count
      const votesRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/votes`);
      await set(votesRef, newVotes);
      
      // Record the user's vote
      const voterRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/voters/${user.uid}`);
      
      // Calculate the new user vote:
      // - For multiple votes allowed: increment their current vote
      // - For single votes only: set to the new direction, or zero if they're toggling an existing vote
      let newUserVote;
      if (multipleVotesAllowed) {
        newUserVote = userCurrentVote + delta;
      } else {
        // If they had a previous vote and are voting opposite, clear their vote (userCurrentVote + delta = 0)
        // If they had no previous vote, set to new direction (delta)
        newUserVote = (userCurrentVote !== 0 && delta === -userCurrentVote) ? 0 : delta;
      }
      
      if (newUserVote === 0) {
        // If the vote is cleared, remove from the database
        await remove(voterRef);
      } else {
        // Otherwise store the vote
        await set(voterRef, newUserVote);
      }
      
      // Show an appropriate message based on what happened
      if (!multipleVotesAllowed && userCurrentVote !== 0 && delta === -userCurrentVote) {
        showNotification('Vote removed');
      } else {
        showNotification(message);
      }
    } catch (error) {
      console.error('Error updating votes:', error);
    }
  }, [boardId, columnId, cardId, cardData.votes, cardData.voters, user, multipleVotesAllowed, showNotification]);

  const upvoteCard = useCallback((e) => {
    updateVotes(1, e, 'Upvoted card');
  }, [updateVotes]);

  const downvoteCard = useCallback((e) => {
    updateVotes(-1, e, 'Downvoted card');
  }, [updateVotes]);

  return {
    // Voting operations
    upvoteCard,
    downvoteCard
  };
}