import { 
  MessageSquare, ThumbsUp, Heart, 
  Users, Layers, Tag, CheckSquare, Award,
  Activity, Smile, Meh, Frown, FileText
} from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { useBoardInsights } from '../hooks/useBoardInsights';


/**
 * Inline insights content — renders board analytics without any modal wrapper.
 * Used inside the Settings panel Insights tab.
 */
export default function InsightsContent() {
  const { columns, actionItems, activeUsers } = useBoardContext();
  
  const {
    stats = {},
    columnDistribution = [],
    themes = [],
    sentiment = {},
    topVotedCards = [],
    mostDiscussed = [],
    mostReacted = [],
    actionItemsSummary = { total: 0 },
    engagementScore = 0,
    engagementFactors = {},
    summary = '',
    isEmpty = true
  } = useBoardInsights({ columns, actionItems, activeUsers });

  // Helper to determine color based on score
  const getScoreColor = (score) => {
    if (score < 34) return 'var(--danger)';
    if (score < 67) return 'var(--warning-color)';
    return 'var(--success-color, var(--success))';
  };

  const engagementColor = getScoreColor(engagementScore);
  const sentimentScore = sentiment.score || 0;
  const sentimentColor = getScoreColor(sentimentScore);

  if (isEmpty) {
    return (
      <div className="insights-empty-state">
        <Activity size={48} className="insights-empty-icon" />
        <h3>No data yet</h3>
        <p>Add some cards, votes, and comments to see insights.</p>
      </div>
    );
  }

  return (
    <div className="insights-content">
      
      {/* Summary Callout */}
      {summary && (
        <section className="insights-section insights-summary-section">
          <div className="insights-summary-box">
            <p>{summary}</p>
          </div>
        </section>
      )}

      {/* Key Stats Grid */}
      <section className="insights-section">
        <h3 className="insights-section-title">Overview</h3>
        <div className="insights-stats-grid">
          <div className="insights-stat-card">
            <div className="insights-stat-icon"><FileText size={18} /></div>
            <div className="insights-stat-info">
              <span className="insights-stat-value">{stats.totalCards || 0}</span>
              <span className="insights-stat-label">Total Cards</span>
            </div>
          </div>
          <div className="insights-stat-card">
            <div className="insights-stat-icon"><ThumbsUp size={18} /></div>
            <div className="insights-stat-info">
              <span className="insights-stat-value">{stats.totalVotes || 0}</span>
              <span className="insights-stat-label">Total Votes</span>
            </div>
          </div>
          <div className="insights-stat-card">
            <div className="insights-stat-icon"><MessageSquare size={18} /></div>
            <div className="insights-stat-info">
              <span className="insights-stat-value">{stats.totalComments || 0}</span>
              <span className="insights-stat-label">Comments</span>
            </div>
          </div>
          <div className="insights-stat-card">
            <div className="insights-stat-icon"><Heart size={18} /></div>
            <div className="insights-stat-info">
              <span className="insights-stat-value">{stats.totalReactions || 0}</span>
              <span className="insights-stat-label">Reactions</span>
            </div>
          </div>
          <div className="insights-stat-card">
            <div className="insights-stat-icon"><Users size={18} /></div>
            <div className="insights-stat-info">
              <span className="insights-stat-value">{stats.uniqueAuthors || 0}</span>
              <span className="insights-stat-label">Authors</span>
            </div>
          </div>
          <div className="insights-stat-card">
            <div className="insights-stat-icon"><Layers size={18} /></div>
            <div className="insights-stat-info">
              <span className="insights-stat-value">{stats.totalGroups || 0}</span>
              <span className="insights-stat-label">Groups</span>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement & Sentiment Row */}
      <div className="insights-row-2col">
        {/* Engagement Score */}
        <section className="insights-section insights-engagement-section">
          <h3 className="insights-section-title">Engagement</h3>
          <div className="insights-engagement-container">
            <div 
              className="insights-donut" 
              style={{ 
                '--score-deg': `${(engagementScore / 100) * 360}deg`,
                '--score-color': engagementColor 
              }}
              role="progressbar"
              aria-valuenow={engagementScore}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div className="insights-donut-inner">
                <span className="insights-donut-value">{Math.round(engagementScore)}</span>
                <span className="insights-donut-label">Score</span>
              </div>
            </div>
            <div className="insights-factors">
              {Object.entries(engagementFactors).map(([key, value]) => (
                <div className="insights-factor" key={key}>
                  <div className="insights-factor-header">
                    <span>{key.replace('Activity', '')}</span>
                  </div>
                  <div className="insights-progress-track">
                    <div 
                      className="insights-progress-fill" 
                      style={{ width: `${value * 100}%`, backgroundColor: 'var(--accent)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sentiment Overview */}
        <section className="insights-section insights-sentiment-section">
          <h3 className="insights-section-title">Sentiment</h3>
          <div className="insights-sentiment-container">
            <div className="insights-sentiment-header">
              {sentiment.overall === 'positive' ? <Smile size={24} color="var(--success-color, var(--success))" /> :
               sentiment.overall === 'negative' ? <Frown size={24} color="var(--danger)" /> :
               <Meh size={24} color="var(--warning-color)" />}
              <span className="insights-sentiment-text" style={{ color: sentimentColor }}>
                {sentiment.overall || 'Neutral'}
              </span>
            </div>
            <div className="insights-sentiment-meter" role="progressbar" aria-valuenow={sentimentScore} aria-valuemin="0" aria-valuemax="100">
              <div className="insights-sentiment-track">
                <div 
                  className="insights-sentiment-fill" 
                  style={{ width: `${sentimentScore}%`, backgroundColor: sentimentColor }}
                />
              </div>
              <div className="insights-sentiment-labels">
                <span>Negative</span>
                <span>Positive</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Action Items Summary */}
      {actionItemsSummary.total > 0 && (
        <section className="insights-section insights-action-items">
          <h3 className="insights-section-title"><CheckSquare size={16} /> Action Items</h3>
          <div className="insights-ai-stats">
            <div className="insights-ai-stat">
              <span className="insights-ai-value">{actionItemsSummary.open}</span>
              <span className="insights-ai-label">Open</span>
            </div>
            <div className="insights-ai-stat">
              <span className="insights-ai-value">{actionItemsSummary.done}</span>
              <span className="insights-ai-label">Done</span>
            </div>
            <div className="insights-ai-stat">
              <span className="insights-ai-value" style={{ color: actionItemsSummary.overdue > 0 ? 'var(--danger)' : 'inherit' }}>
                {actionItemsSummary.overdue}
              </span>
              <span className="insights-ai-label">Overdue</span>
            </div>
          </div>
          <div className="insights-progress-track insights-ai-progress" role="progressbar" aria-valuenow={actionItemsSummary.completionRate} aria-valuemin="0" aria-valuemax="100">
            <div 
              className="insights-progress-fill" 
              style={{ width: `${actionItemsSummary.completionRate}%`, backgroundColor: 'var(--success-color, var(--success))' }}
            />
          </div>
        </section>
      )}

      {/* Column Distribution */}
      {columnDistribution.length > 0 && (
        <section className="insights-section">
          <h3 className="insights-section-title">Card Distribution</h3>
          <div className="insights-bar-chart">
            {columnDistribution.map(col => (
              <div className="insights-bar-row" key={col.id}>
                <div className="insights-bar-label">
                  <span className="insights-bar-title">{col.title}</span>
                  <span className="insights-bar-count">{col.cardCount}</span>
                </div>
                <div className="insights-progress-track">
                  <div 
                    className="insights-progress-fill insights-bar-fill" 
                    style={{ width: `${col.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Themes */}
      {themes.length > 0 && (
        <section className="insights-section">
          <h3 className="insights-section-title"><Tag size={16} /> Top Themes</h3>
          <div className="insights-themes-cloud">
            {themes.map((theme, i) => (
              <span 
                key={i} 
                className={`insights-theme-tag ${theme.type === 'phrase' ? 'insights-theme-phrase' : ''}`}
              >
                {theme.word}
                <span className="insights-theme-count">{theme.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Top Items Grid */}
      <div className="insights-top-items-grid">
        {topVotedCards.length > 0 && (
          <section className="insights-section insights-top-list">
            <h3 className="insights-section-title"><Award size={16} /> Most Voted</h3>
            <div className="insights-list">
              {topVotedCards.slice(0, 3).map(card => (
                <div className="insights-list-item" key={card.id}>
                  <div className="insights-item-content">{card.content.substring(0, 60)}{card.content.length > 60 ? '...' : ''}</div>
                  <div className="insights-item-meta">
                    <span className="insights-meta-badge insights-meta-col">{card.columnTitle}</span>
                    <span className="insights-meta-badge insights-meta-count"><ThumbsUp size={12}/> {card.votes}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {mostDiscussed.length > 0 && (
          <section className="insights-section insights-top-list">
            <h3 className="insights-section-title"><MessageSquare size={16} /> Most Discussed</h3>
            <div className="insights-list">
              {mostDiscussed.slice(0, 3).map(card => (
                <div className="insights-list-item" key={card.id}>
                  <div className="insights-item-content">{card.content.substring(0, 60)}{card.content.length > 60 ? '...' : ''}</div>
                  <div className="insights-item-meta">
                    <span className="insights-meta-badge insights-meta-col">{card.columnTitle}</span>
                    <span className="insights-meta-badge insights-meta-count"><MessageSquare size={12}/> {card.commentCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {mostReacted.length > 0 && (
          <section className="insights-section insights-top-list">
            <h3 className="insights-section-title"><Heart size={16} /> Most Reacted</h3>
            <div className="insights-list">
              {mostReacted.slice(0, 3).map(card => (
                <div className="insights-list-item" key={card.id}>
                  <div className="insights-item-content">{card.content.substring(0, 60)}{card.content.length > 60 ? '...' : ''}</div>
                  <div className="insights-item-meta">
                    <span className="insights-meta-badge insights-meta-col">{card.columnTitle}</span>
                    <span className="insights-meta-badge insights-meta-count"><Heart size={12}/> {card.reactionCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

    </div>
  );
}
