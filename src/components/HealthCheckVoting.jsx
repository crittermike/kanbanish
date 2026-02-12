import { useState } from 'react';
import { Users, BarChart, ArrowLeft } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import HealthCheckResults from './HealthCheckResults';

const RATING_LABELS = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Great'
};

const RATING_COLORS = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#84cc16',
  5: '#22c55e'
};

const HealthCheckVoting = () => {
  const {
    userHealthCheckVotes,
    submitHealthCheckVote,
    HEALTH_CHECK_QUESTIONS,
    activeUsers,
    healthCheckVotes
  } = useBoardContext();

  const [hoveredRatings, setHoveredRatings] = useState({});
  const [showResults, setShowResults] = useState(false);

  const handleVote = (questionId, rating) => {
    submitHealthCheckVote(questionId, rating);
  };

  const handleMouseEnter = (questionId, rating) => {
    setHoveredRatings(prev => ({ ...prev, [questionId]: rating }));
  };

  const handleMouseLeave = (questionId) => {
    setHoveredRatings(prev => ({ ...prev, [questionId]: 0 }));
  };

  const getDisplayRating = (questionId) => {
    return hoveredRatings[questionId] || userHealthCheckVotes[questionId] || 0;
  };

  // Count unique users who have voted on at least one question
  const getVotedUserCount = () => {
    const userIds = new Set();
    Object.values(healthCheckVotes).forEach(questionVotes => {
      Object.keys(questionVotes).forEach(uid => userIds.add(uid));
    });
    return userIds.size;
  };

  const votedCount = getVotedUserCount();
  const answeredCount = Object.keys(userHealthCheckVotes).length;
  const totalQuestions = HEALTH_CHECK_QUESTIONS.length;
  const progressPercentage = activeUsers > 0 ? Math.round((votedCount / activeUsers) * 100) : 0;

  if (showResults) {
    return (
      <div>
        <HealthCheckResults />
        <div className="health-check-results-nav">
          <button
            className="btn secondary-btn btn-with-icon"
            onClick={() => setShowResults(false)}
          >
            <ArrowLeft size={16} />
            Back to Voting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="health-check-voting">
      <div className="health-check-header">
        <h3>Team Health Check</h3>
        <p>Rate each area from 1 (terrible) to 5 (great). Your votes are private until results are revealed.</p>
      </div>

      <div className="voting-progress">
        <div className="progress-header">
          <div className="progress-title">
            <Users size={16} />
            <span>Participation</span>
          </div>
          <div className="progress-stats">
            {votedCount} of {activeUsers} participants have started ({progressPercentage}%)
          </div>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="health-check-questions">
        {HEALTH_CHECK_QUESTIONS.map(question => {
          const displayRating = getDisplayRating(question.id);
          const userVote = userHealthCheckVotes[question.id];

          return (
            <div key={question.id} className="health-check-question" data-testid={`health-check-question-${question.id}`}>
              <div className="question-info">
                <h4>{question.label}</h4>
                <p>{question.description}</p>
              </div>
              <div className="question-rating">
                <div className="rating-buttons">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      className={`rating-button ${displayRating >= rating ? 'active' : ''}`}
                      onClick={() => handleVote(question.id, rating)}
                      onMouseEnter={() => handleMouseEnter(question.id, rating)}
                      onMouseLeave={() => handleMouseLeave(question.id)}
                      style={{
                        backgroundColor: displayRating >= rating ? RATING_COLORS[rating] : undefined
                      }}
                      data-tooltip={RATING_LABELS[rating]}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                {userVote && !hoveredRatings[question.id] && (
                  <span className="vote-check">✓</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="health-check-status">
        {answeredCount === totalQuestions ? (
          <p className="all-answered">✓ You have rated all {totalQuestions} areas.</p>
        ) : (
          <p className="remaining">{answeredCount} of {totalQuestions} areas rated</p>
        )}
        <button
          className="btn primary-btn btn-with-icon health-check-view-results-btn"
          onClick={() => setShowResults(true)}
        >
          <BarChart size={16} />
          View Results
        </button>
      </div>
    </div>
  );
};

export default HealthCheckVoting;
