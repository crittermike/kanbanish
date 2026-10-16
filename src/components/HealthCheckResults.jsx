import { RotateCcw, Users } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { getScoreLabel, getScoreRatingLevel } from '../utils/ratingUtils';

const HealthCheckResults = () => {
  const { getHealthCheckStats, healthCheckVotes, resetHealthCheck } = useBoardContext();
  const stats = getHealthCheckStats();

  const questionsWithVotes = stats.filter(q => q.totalVotes > 0);

  const participantIds = new Set();
  Object.values(healthCheckVotes || {}).forEach(questionVotes => {
    Object.keys(questionVotes).forEach(uid => participantIds.add(uid));
  });
  const totalParticipants = participantIds.size;

  const overallAverage = questionsWithVotes.length > 0
    ? questionsWithVotes.reduce((sum, q) => sum + q.average, 0) / questionsWithVotes.length
    : 0;

  const handleReset = () => {
    if (window.confirm('Reset the health check? This will clear all votes and cannot be undone.')) {
      resetHealthCheck();
    }
  };

  if (questionsWithVotes.length === 0) {
    return (
      <div className="health-check-results">
        <p className="health-check-empty">No votes yet</p>
      </div>
    );
  }

  const overallLevel = getScoreRatingLevel(overallAverage);

  return (
    <div className="health-check-results">
      <div className="health-results-summary">
        <span className={`health-results-overall score-color-${overallLevel}`} data-testid="health-overall-score">
          {overallAverage.toFixed(1)}
        </span>
        <span className={`health-results-label score-color-${overallLevel}`}>{getScoreLabel(overallAverage)}</span>
        <span className="health-results-participants">
          <Users size={14} />
          {totalParticipants}
        </span>
      </div>

      <ul className="health-check-bars">
        {stats.map(question => {
          const level = getScoreRatingLevel(question.average);
          const maxCount = Math.max(1, ...question.distribution);
          return (
            <li key={question.id} className="health-bar-row" data-testid={`health-result-${question.id}`}>
              <span className="health-bar-name" title={question.description}>{question.label}</span>
              <div className="health-bar-container">
                <div
                  className="health-bar-fill"
                  data-rating={level}
                  style={{ width: question.totalVotes > 0 ? `${(question.average / 5) * 100}%` : '0%' }}
                />
              </div>
              <span className="health-bar-score">
                {question.totalVotes > 0 ? (
                  <span className={`score-color-${level}`}>{question.average.toFixed(1)}</span>
                ) : (
                  <span className="no-data">—</span>
                )}
              </span>
              <div className="health-bar-dist" aria-label={`${question.label} vote distribution`}>
                {question.distribution.map((count, index) => (
                  <span
                    key={index}
                    className="dist-bar"
                    data-rating={index + 1}
                    title={`${index + 1}: ${count}`}
                    style={{ height: `${Math.max(8, (count / maxCount) * 100)}%`, opacity: count > 0 ? 1 : 0.2 }}
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      <button type="button" className="health-check-reset-btn" onClick={handleReset}>
        <RotateCcw size={12} />
        Reset health check
      </button>
    </div>
  );
};

export default HealthCheckResults;
