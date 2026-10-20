import { useState } from 'react';
import { ArrowLeft, BarChart2, Users } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import HealthCheckResults from './HealthCheckResults';

const RATING_LABELS = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Great'
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

  const getDisplayRating = (questionId) => {
    return hoveredRatings[questionId] || userHealthCheckVotes[questionId] || 0;
  };

  const votedUserIds = new Set();
  Object.values(healthCheckVotes || {}).forEach(questionVotes => {
    Object.keys(questionVotes).forEach(uid => votedUserIds.add(uid));
  });

  // Live results update as others answer
  if (showResults) {
    return (
      <div className="health-check-live-results">
        <button type="button" className="health-check-toggle-btn" onClick={() => setShowResults(false)}>
          <ArrowLeft size={14} aria-hidden="true" />
          Your answers
        </button>
        <HealthCheckResults />
      </div>
    );
  }

  return (
    <div className="health-check-voting">
      <div className="health-check-questions">
        {HEALTH_CHECK_QUESTIONS.map(question => {
          const displayRating = getDisplayRating(question.id);

          return (
            <div key={question.id} className="health-check-question" data-testid={`health-check-question-${question.id}`}>
              <div className="question-info">
                <h4>{question.label}</h4>
                <p>{question.description}</p>
              </div>
              <div className="rating-buttons" role="group" aria-label={question.label}>
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    className={`rating-button ${displayRating >= rating ? 'active' : ''}`}
                    onClick={() => submitHealthCheckVote(question.id, rating)}
                    onMouseEnter={() => setHoveredRatings(prev => ({ ...prev, [question.id]: rating }))}
                    onMouseLeave={() => setHoveredRatings(prev => ({ ...prev, [question.id]: 0 }))}
                    aria-pressed={userHealthCheckVotes[question.id] === rating}
                    data-rating={rating}
                    data-tooltip={RATING_LABELS[rating]}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="health-check-participation" data-testid="health-check-participation">
        <Users size={14} />
        <span>{votedUserIds.size} of {activeUsers} voted</span>
        <span aria-hidden="true">·</span>
        <button type="button" className="health-check-toggle-btn" onClick={() => setShowResults(true)}>
          <BarChart2 size={14} aria-hidden="true" />
          See results
        </button>
      </div>
    </div>
  );
};

export default HealthCheckVoting;
