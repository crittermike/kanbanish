import React, { useCallback } from 'react';
import { ArrowDown, ThumbsUp, Settings, Sun, Moon, Heart, Link, FileText } from 'react-feather';
import { useNotification } from '../context/NotificationContext';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import Timer from './Timer';

/**
 * Settings panel with board action buttons (Health Check, Timer),
 * a settings dropdown (sort, voting, retrospective toggles), and theme toggle.
 *
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
  const dropdownRef = React.useRef(null);

  const handleClickOutside = useCallback(() => {
    setSortDropdownOpen(false);
  }, [setSortDropdownOpen]);

  useOnClickOutside(dropdownRef, handleClickOutside);

  return (
    <div className="action-buttons">
      <Timer />
      <div className="sort-dropdown-container" ref={dropdownRef}>
        <button
          id="settings-dropdown-button"
          className="btn icon-btn settings-toggle-btn"
          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          aria-expanded={sortDropdownOpen}
          aria-haspopup="true"
          title="Board settings and preferences"
          aria-label="Board settings"
        >
          <Settings size={16} aria-hidden="true" />
        </button>

        {sortDropdownOpen && (
          <div className="sort-dropdown-menu">
            <div className="settings-section">
              <button
                className="sort-option"
                onClick={() => {
                  copyShareUrl();
                  setSortDropdownOpen(false);
                }}
              >
                <Link size={14} />
                Share Board
              </button>
              <button
                className="sort-option"
                onClick={() => {
                  handleExportBoard();
                  setSortDropdownOpen(false);
                }}
              >
                <FileText size={14} />
                Export Board
              </button>
              <button
                className="sort-option"
                onClick={() => {
                  handleStartHealthCheck();
                  setSortDropdownOpen(false);
                }}
              >
                <Heart size={14} />
                Start Health Check
              </button>
            </div>
            <div className="settings-divider"></div>
            <div className="settings-section">
              <h4 className="settings-section-title">Sort Cards</h4>
              <button
                className={`sort-option ${!sortByVotes ? 'selected' : ''}`}
                onClick={() => {
                  setSortByVotes(false);
                }}
              >
                <ArrowDown size={14} />
                Chronological
                {!sortByVotes && <span className="checkmark">✓</span>}
              </button>
              <button
                className={`sort-option ${sortByVotes ? 'selected' : ''}`}
                onClick={() => {
                  setSortByVotes(true);
                }}
              >
                <ThumbsUp size={14} />
                By Votes
                {sortByVotes && <span className="checkmark">✓</span>}
              </button>
            </div>
            <div className="settings-divider"></div>
            <div className="settings-section">
              <h4 className="settings-section-title">Allow voting?</h4>
              <div className="settings-boolean-option">
                <button
                  className={`boolean-option ${votingEnabled ? 'selected' : ''}`}
                  onClick={() => {
                    updateVotingEnabled(true);
                  }}
                >
                  Yes
                </button>
                <button
                  className={`boolean-option ${!votingEnabled ? 'selected' : ''}`}
                  onClick={() => {
                    updateVotingEnabled(false);
                  }}
                >
                  No
                </button>
              </div>
            </div>
            {votingEnabled && (
              <>
                <div className="settings-divider"></div>
                <div className="settings-section">
                  <h4 className="settings-section-title">Allow downvoting?</h4>
                  <div className="settings-boolean-option">
                    <button
                      className={`boolean-option ${downvotingEnabled ? 'selected' : ''}`}
                      onClick={() => {
                        updateDownvotingEnabled(true);
                      }}
                    >
                      Yes
                    </button>
                    <button
                      className={`boolean-option ${!downvotingEnabled ? 'selected' : ''}`}
                      onClick={() => {
                        updateDownvotingEnabled(false);
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div className="settings-divider"></div>
                <div className="settings-section">
                  <h4 className="settings-section-title">Allow users to vote multiple times on the same card?</h4>
                  <div className="settings-boolean-option">
                    <button
                      className={`boolean-option ${multipleVotesAllowed ? 'selected' : ''}`}
                      onClick={() => {
                        updateMultipleVotesAllowed(true);
                      }}
                    >
                      Yes
                    </button>
                    <button
                      className={`boolean-option ${!multipleVotesAllowed ? 'selected' : ''}`}
                      onClick={() => {
                        updateMultipleVotesAllowed(false);
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div className="settings-divider"></div>
                <div className="settings-section">
                  <h4 className="settings-section-title">Retrospective Mode</h4>
                  <div className="settings-boolean-option">
                    <button
                      className={`boolean-option ${retrospectiveMode ? 'selected' : ''}`}
                      onClick={() => {
                        updateRetrospectiveMode(true);
                      }}
                    >
                      On
                    </button>
                    <button
                      className={`boolean-option ${!retrospectiveMode ? 'selected' : ''}`}
                      onClick={() => {
                        updateRetrospectiveMode(false);
                      }}
                    >
                      Off
                    </button>
                  </div>
                  <p className="settings-hint">
                    When enabled, new cards appear with hidden text until revealed
                  </p>
                </div>
                <div className="settings-divider"></div>
                <div className="settings-section settings-section-padded">
                  <button
                    className="btn danger-btn settings-full-width-btn"
                    onClick={() => {
                      if (resetAllVotes()) {
                        showNotification('All votes reset to zero');
                        // Keep dropdown open after resetting votes
                      }
                    }}
                  >
                    Reset all votes
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <button
        id="theme-toggle"
        className="btn icon-btn"
        onClick={() => {
          updateDarkMode(!darkMode);
        }}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      </button>
    </div>
  );
};

export default SettingsPanel;
