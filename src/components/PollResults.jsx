import React from 'react';
import { useBoardContext } from '../context/BoardContext';
import { Star, Users } from 'react-feather';

const PollResults = () => {
  const { getPollStats } = useBoardContext();
  const stats = getPollStats();

  const getBarWidth = (count) => {
    if (stats.totalVotes === 0) return 0;
    return (count / stats.totalVotes) * 100;
  };

  const getEffectivenessLevel = (average) => {
    if (average >= 4.5) return { text: 'Extremely Effective', color: '#22c55e' };
    if (average >= 3.5) return { text: 'Very Effective', color: '#84cc16' };
    if (average >= 2.5) return { text: 'Moderately Effective', color: '#eab308' };
    if (average >= 1.5) return { text: 'Slightly Effective', color: '#f97316' };
    return { text: 'Not Effective', color: '#ef4444' };
  };

  const effectiveness = getEffectivenessLevel(stats.average);

  return (
    <div className="poll-results">
      <div className="results-header">
        <h3>Retrospective Effectiveness Results</h3>
        <div className="participation-stats">
          <Users size={16} />
          <span>{stats.totalVotes} participant{stats.totalVotes !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {stats.totalVotes > 0 ? (
        <>
          <div className="overall-score">
            <div className="score-display">
              <div className="average-rating">
                <span className="score-number">{stats.average.toFixed(1)}</span>
                <span className="score-separator">/</span>
                <span className="score-max">5.0</span>
              </div>
              <div className="stars-display">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Star
                    key={rating}
                    size={20}
                    fill={stats.average >= rating ? '#ffd700' : 'none'}
                    color={stats.average >= rating ? '#ffd700' : '#ccc'}
                  />
                ))}
              </div>
            </div>
            <div 
              className="effectiveness-label"
              style={{ color: effectiveness.color }}
            >
              {effectiveness.text}
            </div>
          </div>

          <div className="distribution-chart">
            <h4>Vote Distribution</h4>
            <div className="chart">
              {stats.distribution.map((count, index) => {
                const rating = index + 1;
                const percentage = ((count / stats.totalVotes) * 100).toFixed(1);
                return (
                  <div key={rating} className="chart-row">
                    <div className="rating-label">
                      <Star size={14} fill="#ffd700" color="#ffd700" />
                      <span>{rating}</span>
                    </div>
                    <div className="bar-container">
                      <div 
                        className="bar"
                        style={{ 
                          width: `${getBarWidth(count)}%`,
                          backgroundColor: rating >= 4 ? '#22c55e' : 
                                          rating >= 3 ? '#84cc16' : 
                                          rating >= 2 ? '#eab308' : '#ef4444'
                        }}
                      />
                    </div>
                    <div className="count-label">
                      <span className="count">{count}</span>
                      <span className="percentage">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="results-summary">
            <div className="summary-cards">
              <div className="summary-card">
                <h5>Highest Rating</h5>
                <div className="summary-value">
                  {Math.max(...stats.distribution.map((count, index) => count > 0 ? index + 1 : 0))}
                  <Star size={14} fill="#ffd700" color="#ffd700" />
                </div>
              </div>
              <div className="summary-card">
                <h5>Most Common</h5>
                <div className="summary-value">
                  {stats.distribution.indexOf(Math.max(...stats.distribution)) + 1}
                  <Star size={14} fill="#ffd700" color="#ffd700" />
                </div>
              </div>
              <div className="summary-card">
                <h5>Response Rate</h5>
                <div className="summary-value">100%</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="no-votes">
          <p>No votes have been submitted yet.</p>
          <p>Participants need to complete the poll phase first.</p>
        </div>
      )}
    </div>
  );
};

export default PollResults;
