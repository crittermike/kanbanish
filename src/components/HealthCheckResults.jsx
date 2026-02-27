import { Users } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { getScoreLabel, getScoreRatingLevel } from '../utils/ratingUtils';

const HealthCheckResults = () => {
  const { getHealthCheckStats } = useBoardContext();
  const stats = getHealthCheckStats();

  const questionsWithVotes = stats.filter(q => q.totalVotes > 0);
  const totalParticipants = questionsWithVotes.length > 0
    ? Math.max(...questionsWithVotes.map(q => q.totalVotes))
    : 0;

  const overallAverage = questionsWithVotes.length > 0
    ? questionsWithVotes.reduce((sum, q) => sum + q.average, 0) / questionsWithVotes.length
    : 0;

  return (
    <div className="health-check-results">
      <div className="results-header">
        <h3>Team Health Check Results</h3>
        <div className="participation-stats">
          <Users size={16} />
          <span>{totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {questionsWithVotes.length > 0 ? (
        <>
          <div className="overall-score">
            <div className="score-display">
              <div className="average-rating">
                <span className={`score-number score-color-${getScoreRatingLevel(overallAverage)}`}>
                  {overallAverage.toFixed(1)}
                </span>
                <span className="score-separator">/</span>
                <span className="score-max">5.0</span>
              </div>
            </div>
            <div className={`effectiveness-label score-color-${getScoreRatingLevel(overallAverage)}`}>
              Overall: {getScoreLabel(overallAverage)}
            </div>
          </div>

          <div className="health-check-chart">
            <h4>Results by Area</h4>
            <div className="health-check-bars">
              {stats.map(question => (
                <div key={question.id} className="health-bar-row" data-testid={`health-result-${question.id}`}>
                  <div className="health-bar-label">
                    <span className="health-bar-name">{question.label}</span>
                    <span className="health-bar-desc">{question.description}</span>
                  </div>
                  <div className="health-bar-container">
                    <div
                      className="health-bar-fill"
                      data-rating={getScoreRatingLevel(question.average)}
                      style={{
                        width: question.totalVotes > 0 ? `${(question.average / 5) * 100}%` : '0%'
                      }}
                    />
                  </div>
                  <div className="health-bar-score">
                    {question.totalVotes > 0 ? (
                      <span className={`score-color-${getScoreRatingLevel(question.average)}`}>
                        {question.average.toFixed(1)}
                      </span>
                    ) : (
                      <span className="no-data">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="health-check-distribution">
            <h4>Vote Distribution</h4>
            {stats.filter(q => q.totalVotes > 0).map(question => (
              <div key={question.id} className="distribution-row">
                <h5>{question.label}</h5>
                <div className="distribution-bars">
                  {question.distribution.map((count, index) => {
                    const rating = index + 1;
                    const percentage = question.totalVotes > 0 ? ((count / question.totalVotes) * 100).toFixed(0) : 0;
                    return (
                      <div key={rating} className="dist-bar-group">
                        <div className="dist-bar-wrapper">
                          <div
                            className="dist-bar"
                            style={{
                              height: `${percentage}%`
                            }}
                            data-rating={rating}
                          />
                        </div>
                        <span className="dist-label">{rating}</span>
                        <span className="dist-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="no-votes">
          <p>No votes have been submitted yet.</p>
          <p>Participants need to complete the health check first.</p>
        </div>
      )}
    </div>
  );
};

export default HealthCheckResults;
