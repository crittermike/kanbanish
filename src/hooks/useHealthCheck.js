import { ref, set } from 'firebase/database';
import { useCallback } from 'react';
import { database } from '../utils/firebase';

/**
 * Health check question definitions.
 */
export const HEALTH_CHECK_QUESTIONS = [
  { id: 'teamwork', label: 'Teamwork', description: 'How well is the team collaborating?' },
  { id: 'process', label: 'Process', description: 'How effective are our processes?' },
  { id: 'delivery', label: 'Delivery', description: 'How confident are we in delivering on time?' },
  { id: 'fun', label: 'Fun', description: 'How much fun are we having at work?' },
  { id: 'learning', label: 'Learning', description: 'How much are we learning and improving?' },
  { id: 'support', label: 'Support', description: 'How supported do you feel by the team?' },
  { id: 'mission', label: 'Mission', description: 'How clear and meaningful is our mission?' },
  { id: 'speed', label: 'Speed', description: 'How satisfied are you with our pace of work?' }
];

/**
 * Hook for health check voting functionality.
 *
 * @param {Object} params
 * @param {string|null} params.boardId - Current board ID
 * @param {Object|null} params.user - Current Firebase user
 * @param {Object} params.healthCheckVotes - All health check votes
 * @param {Function} params.setUserHealthCheckVotes - Setter for current user's health check votes
 * @returns {Object} Health check operations and constants
 */
export const useHealthCheck = ({ boardId, user, healthCheckVotes, setUserHealthCheckVotes }) => {
  const submitHealthCheckVote = useCallback((questionId, rating) => {
    if (!boardId || !user || rating < 1 || rating > 5) {
      return;
    }

    const voteRef = ref(database, `boards/${boardId}/healthCheck/votes/${questionId}/${user.uid}`);
    set(voteRef, rating).then(() => {
      setUserHealthCheckVotes(prev => ({ ...prev, [questionId]: rating }));
    }).catch(error => {
      console.error('Error submitting health check vote:', error);
    });
  }, [boardId, user, setUserHealthCheckVotes]);

  const getHealthCheckStats = useCallback(() => {
    return HEALTH_CHECK_QUESTIONS.map(question => {
      const questionVotes = healthCheckVotes[question.id] || {};
      const votes = Object.values(questionVotes);

      if (votes.length === 0) {
        return { ...question, average: 0, distribution: [0, 0, 0, 0, 0], totalVotes: 0 };
      }

      const distribution = [0, 0, 0, 0, 0];
      let sum = 0;

      votes.forEach(vote => {
        if (vote >= 1 && vote <= 5) {
          distribution[vote - 1]++;
          sum += vote;
        }
      });

      const average = sum / votes.length;
      return { ...question, average, distribution, totalVotes: votes.length };
    });
  }, [healthCheckVotes]);

  return { HEALTH_CHECK_QUESTIONS, submitHealthCheckVote, getHealthCheckStats };
};
