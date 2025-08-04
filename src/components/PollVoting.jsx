import React, { useState } from 'react';
import { useBoardContext } from '../context/BoardContext';
import { Star, Users } from 'react-feather';

const PollVoting = () => {
  const { userPollVote, submitPollVote, getPollStats, activeUsers, pollVotes } = useBoardContext();
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleVote = (rating) => {
    submitPollVote(rating);
  };

  const handleMouseEnter = (rating) => {
    setHoveredRating(rating);
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  const getRatingDescription = (rating) => {
    const descriptions = {
      1: 'Not effective at all',
      2: 'Slightly effective',
      3: 'Moderately effective',
      4: 'Very effective',
      5: 'Extremely effective'
    };
    return descriptions[rating] || '';
  };

  const getDisplayRating = () => {
    return hoveredRating || userPollVote || 0;
  };

  const pollStats = getPollStats();
  const votedCount = pollStats.totalVotes;
  const progressPercentage = activeUsers > 0 ? Math.round((votedCount / activeUsers) * 100) : 0;

  return (
    <div className="poll-voting">
      <div className="poll-question">
        <h3>How effective was this retrospective?</h3>
        <p>Rate from 1 (not effective) to 5 (extremely effective)</p>
      </div>

      <div className="voting-progress">
        <div className="progress-header">
          <div className="progress-title">
            <Users size={16} />
            <span>Voting Progress</span>
          </div>
          <div className="progress-stats">
            {votedCount} of {activeUsers} participants have voted ({progressPercentage}%)
          </div>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        {progressPercentage === 100 && activeUsers > 0 && (
          <div className="progress-complete">
            ✓ All participants have voted! Ready to view results.
          </div>
        )}
      </div>

      <div className="rating-container">
        <div className="stars">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              className={`star-button ${getDisplayRating() >= rating ? 'active' : ''}`}
              onClick={() => handleVote(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              disabled={false}
            >
              <Star 
                size={32} 
                fill={getDisplayRating() >= rating ? '#ffd700' : 'none'}
                color={getDisplayRating() >= rating ? '#ffd700' : '#ccc'}
              />
            </button>
          ))}
        </div>
        
        <div className="rating-info">
          <div className="rating-number">
            {getDisplayRating() > 0 && (
              <span className="current-rating">{getDisplayRating()}/5</span>
            )}
          </div>
          <div className="rating-description">
            {getDisplayRating() > 0 && getRatingDescription(getDisplayRating())}
          </div>
        </div>
      </div>

      {userPollVote && (
        <div className="vote-status">
          <p className="vote-submitted">
            ✓ Your vote has been submitted: {userPollVote}/5 stars
          </p>
          <p className="vote-change-info">
            You can change your vote by clicking a different star rating.
          </p>
        </div>
      )}

      {!userPollVote && (
        <div className="vote-prompt">
          <p>Click on a star to submit your rating</p>
        </div>
      )}
    </div>
  );
};

export default PollVoting;
