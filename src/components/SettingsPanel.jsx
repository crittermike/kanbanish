import { useCallback, useEffect } from 'react';
import { ArrowDown, ThumbsUp, Settings, Sun, Moon, Link, FileText } from 'react-feather';
import { useNotification } from '../context/NotificationContext';
import Timer from './Timer';

/**
 * a settings modal (quick actions, sort, voting, retrospective toggles, theme).
 * @param {Object} props
 * @param {Function} props.handleStartHealthCheck - Starts health check phase
 * @param {boolean} props.sortByVotes - Whether cards are sorted by votes
 * @param {Function} props.setSortByVotes - Sets the sort-by-votes preference
 * @param {boolean} props.votingEnabled - Whether voting is enabled
 * @param {Function} props.updateVotingEnabled - Toggles voting on/off
 * @param {boolean} props.downvotingEnabled - Whether downvoting is enabled
 * @param {Function} props.updateDownvotingEnabled - Toggles downvoting on/off
 * @param {boolean} props.multipleVotesAllowed - Whether multiple votes per card are allowed
 * @param {Function} props.updateMultipleVotesAllowed - Toggles multiple votes on/off
 * @param {boolean} props.retrospectiveMode - Whether retrospective mode is enabled
 * @param {Function} props.updateRetrospectiveMode - Toggles retrospective mode on/off
 * @param {boolean} props.sortDropdownOpen - Whether the settings dropdown is open
 * @param {Function} props.setSortDropdownOpen - Opens/closes the settings dropdown
 * @param {Function} props.resetAllVotes - Resets all votes on the board
 * @param {boolean} props.darkMode - Whether dark mode is active
 * @param {Function} props.updateDarkMode - Toggles dark/light theme
 */
const SettingsPanel = ({
  handleStartHealthCheck,
  copyShareUrl,
  handleExportBoard,
  sortByVotes,
  setSortByVotes,
  votingEnabled,
  updateVotingEnabled,
  downvotingEnabled,
  updateDownvotingEnabled,
  multipleVotesAllowed,
  updateMultipleVotesAllowed,
  retrospectiveMode,
  updateRetrospectiveMode,
  sortDropdownOpen,
  setSortDropdownOpen,
  resetAllVotes,
  darkMode,
  updateDarkMode
}) => {
  const { showNotification } = useNotification();
  const handleOverlayClick = useCallback((e) => {
    if (e.target.classList.contains('modal-overlay')) {
      setSortDropdownOpen(false);
    }
  }, [setSortDropdownOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sortDropdownOpen) {
        setSortDropdownOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sortDropdownOpen, setSortDropdownOpen]);

  return (
    <div className="action-buttons">
      <Timer />
      
      <button
          id="settings-dropdown-button"
          className="btn icon-btn settings-toggle-btn"
          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
        aria-expanded={sortDropdownOpen}
        aria-haspopup="dialog"
        title="Board settings and preferences"
        aria-label="Board settings"
      >
        <Settings size={16} aria-hidden="true" />
      </button>

      {sortDropdownOpen && (
        <div className="modal-overlay" role="presentation" onClick={handleOverlayClick}>
          <div className="modal-container settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="settings-modal-title">Board Settings</h2>
              <button className="close-button" onClick={() => setSortDropdownOpen(false)} aria-label="Close">&times;</button>
            </div>
            
            <div className="modal-body">
              {/* Appearance */}
              <div className="settings-section">
                <h4 className="settings-section-title">Appearance</h4>
                <div className="settings-boolean-option">
                  <button
                    className={`boolean-option ${!darkMode ? 'selected' : ''}`}
                    onClick={() => updateDarkMode(false)}
                  >
                    <Sun size={14} style={{ marginRight: '6px' }} />
                    Light Mode
                  </button>
                  <button
                    className={`boolean-option ${darkMode ? 'selected' : ''}`}
                    onClick={() => updateDarkMode(true)}
                  >
                    <Moon size={14} style={{ marginRight: '6px' }} />
                    Dark Mode
                  </button>
                </div>
              </div>

              <div className="settings-divider"></div>

              {/* Quick Actions */}
              <div className="settings-section">
                <div className="settings-quick-actions">
                  <button
                    className="settings-quick-action-btn"
                    onClick={() => {
                      copyShareUrl();
                      setSortDropdownOpen(false);
                    }}
                  >
                    <Link size={14} /> Share Board
                  </button>
                  <button
                    className="settings-quick-action-btn"
                    onClick={() => {
                      handleExportBoard();
                      setSortDropdownOpen(false);
                    }}
                  >
                    <FileText size={14} /> Export Board
                  </button>
                </div>
              </div>

              <div className="settings-divider"></div>

              {/* Health Check - Prominent */}
              <div className="settings-section">
                <button
                  className="settings-health-check-btn"
                  onClick={() => {
                    handleStartHealthCheck();
                    setSortDropdownOpen(false);
                  }}
                >
                  <span className="health-check-btn-icon" aria-hidden="true">💚</span>
                  Start Health Check
                </button>
              </div>

              <div className="settings-divider"></div>

              {/* Sort Cards */}
              <div className="settings-section">
                <h4 className="settings-section-title">Sort Cards</h4>
                <div className="settings-boolean-option">
                  <button
                    className={`boolean-option ${!sortByVotes ? 'selected' : ''}`}
                    onClick={() => setSortByVotes(false)}
                  >
                    <ArrowDown size={14} style={{ marginRight: '6px' }} />
                    Chronological
                  </button>
                  <button
                    className={`boolean-option ${sortByVotes ? 'selected' : ''}`}
                    onClick={() => setSortByVotes(true)}
                  >
                    <ThumbsUp size={14} style={{ marginRight: '6px' }} />
                    By Votes
                  </button>
                </div>
              </div>

              <div className="settings-divider"></div>

              {/* Voting Settings */}
              <div className="settings-section">
                <div className="settings-toggle-row">
                  <span className="settings-toggle-label">Allow voting?</span>
                  <button
                    className="settings-toggle-switch"
                    role="switch"
                    aria-checked={votingEnabled}
                    onClick={() => updateVotingEnabled(!votingEnabled)}
                    aria-label="Allow voting"
                  >
                    <span className="settings-toggle-knob"></span>
                  </button>
                </div>
              </div>

              {votingEnabled && (
                <>
                  <div className="settings-section">
                    <div className="settings-toggle-row">
                      <span className="settings-toggle-label">Allow downvoting?</span>
                      <button
                        className="settings-toggle-switch"
                        role="switch"
                        aria-checked={downvotingEnabled}
                        onClick={() => updateDownvotingEnabled(!downvotingEnabled)}
                        aria-label="Allow downvoting"
                      >
                        <span className="settings-toggle-knob"></span>
                      </button>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-toggle-row">
                      <span className="settings-toggle-label">Allow users to vote multiple times on the same card?</span>
                      <button
                        className="settings-toggle-switch"
                        role="switch"
                        aria-checked={multipleVotesAllowed}
                        onClick={() => updateMultipleVotesAllowed(!multipleVotesAllowed)}
                        aria-label="Allow users to vote multiple times on the same card"
                      >
                        <span className="settings-toggle-knob"></span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="settings-divider"></div>

              {/* Retrospective Mode */}
              <div className="settings-section">
                <div className="settings-toggle-row">
                  <span className="settings-toggle-label">Retrospective Mode</span>
                  <button
                    className="settings-toggle-switch"
                    role="switch"
                    aria-checked={retrospectiveMode}
                    onClick={() => updateRetrospectiveMode(!retrospectiveMode)}
                    aria-label="Retrospective Mode"
                  >
                    <span className="settings-toggle-knob"></span>
                  </button>
                </div>
                <p className="settings-hint">
                  When enabled, new cards appear with hidden text until revealed
                </p>
              </div>

              {/* Danger Zone */}
              {votingEnabled && (
                <>
                  <div className="settings-divider"></div>
                  <div className="settings-section settings-section-padded">
                    <button
                      className="btn danger-btn settings-full-width-btn"
                      onClick={() => {
                        if (resetAllVotes()) {
                          showNotification('All votes reset to zero');
                        }
                      }}
                    >
                      Reset all votes
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
