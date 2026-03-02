import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, CheckSquare, ChevronRight, EyeOff, FileText, Link, Monitor, Moon, RotateCcw, Settings, Share2, Sliders, Sun, ThumbsUp, Users, Zap } from 'react-feather';
import { useNotification } from '../context/NotificationContext';

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: Sliders },
  { id: 'voting', label: 'Voting', icon: ThumbsUp },
  { id: 'features', label: 'Features', icon: Zap },
  { id: 'share', label: 'Share & Export', icon: Share2 },
];

/**
 * Settings modal organized with tabs: Appearance, Voting, Features, Share & Export.
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
  updateDarkMode,
  hideCardAuthorship,
  updateHideCardAuthorship,
  showDisplayNames,
  updateShowDisplayNames,
  votesPerUser,
  updateVotesPerUser,
  onOpenActionItems,
  actionItemCount,
  actionItemsEnabled,
  updateActionItemsEnabled,
  children
}) => {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('appearance');

  // Reset to first tab whenever the modal opens
  useEffect(() => {
    if (sortDropdownOpen) {
      setActiveTab('appearance');
    }
  }, [sortDropdownOpen]);

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

  const handleTabKeyDown = (e) => {
    const tabIds = TABS.map(t => t.id);
    const currentIndex = tabIds.indexOf(activeTab);
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % tabIds.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabIds.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    setActiveTab(tabIds[newIndex]);
    // Focus the new tab button
    const tabButton = document.getElementById(`settings-tab-${tabIds[newIndex]}`);
    if (tabButton) tabButton.focus();
  };

  return (
    <div className="action-buttons">

      {actionItemsEnabled && (
        <button
          className="btn icon-btn action-items-header-btn"
          onClick={onOpenActionItems}
          title={`Action Items${actionItemCount > 0 ? ` (${actionItemCount} open)` : ''}`}
          aria-label={`Action Items${actionItemCount > 0 ? ` (${actionItemCount} open)` : ''}`}
        >
          <CheckSquare size={16} aria-hidden="true" />
          {actionItemCount > 0 && <span className="action-items-badge">{actionItemCount}</span>}
        </button>
      )}
      {children}
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

            {/* Tab navigation */}
            <div className="settings-tabs" role="tablist" aria-label="Settings categories" onKeyDown={handleTabKeyDown}>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`settings-tab-${tab.id}`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`settings-tabpanel-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                    className={`settings-tab${isActive ? ' settings-tab-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={14} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="modal-body">
              {/* Appearance Tab */}
              <div
                id="settings-tabpanel-appearance"
                role="tabpanel"
                aria-labelledby="settings-tab-appearance"
                className="settings-tabpanel"
                hidden={activeTab !== 'appearance'}
              >
                {/* Theme */}
                <div className="settings-section">
                  <h4 className="settings-section-title">Theme</h4>
                  <div className="settings-boolean-option">
                    <button
                      className={`boolean-option ${!darkMode ? 'selected' : ''}`}
                      onClick={() => updateDarkMode(false)}
                    >
                      <Sun size={14} aria-hidden="true" />
                      Light
                    </button>
                    <button
                      className={`boolean-option ${darkMode ? 'selected' : ''}`}
                      onClick={() => updateDarkMode(true)}
                    >
                      <Moon size={14} aria-hidden="true" />
                      Dark
                    </button>
                  </div>
                </div>

                <div className="settings-divider" />

                {/* Sort Order */}
                <div className="settings-section">
                  <h4 className="settings-section-title">Sort Cards</h4>
                  <div className="settings-boolean-option">
                    <button
                      className={`boolean-option ${!sortByVotes ? 'selected' : ''}`}
                      onClick={() => setSortByVotes(false)}
                    >
                      <ArrowDown size={14} aria-hidden="true" />
                      Chronological
                    </button>
                    <button
                      className={`boolean-option ${sortByVotes ? 'selected' : ''}`}
                      onClick={() => setSortByVotes(true)}
                    >
                      <ThumbsUp size={14} aria-hidden="true" />
                      By Votes
                    </button>
                  </div>
                </div>
              </div>

              {/* Voting Tab */}
              <div
                id="settings-tabpanel-voting"
                role="tabpanel"
                aria-labelledby="settings-tab-voting"
                className="settings-tabpanel"
                hidden={activeTab !== 'voting'}
              >
                <div className="settings-section">
                  <div className="settings-toggle-row">
                    <span className="settings-toggle-label">Allow voting</span>
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
                        <span className="settings-toggle-label">Allow downvoting</span>
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
                        <span className="settings-toggle-label">Multiple votes per card</span>
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

                    <div className="settings-divider" />

                    <div className="settings-section settings-vote-limit">
                      <h4 className="settings-section-title">Votes per person</h4>
                      <div className="vote-limit-preset-buttons">
                        <button
                          className={`vote-limit-preset ${votesPerUser === 0 ? 'active' : ''}`}
                          onClick={() => updateVotesPerUser(0)}
                        >
                          Unlimited
                        </button>
                        {[3, 5, 10].map(val => (
                          <button
                            key={val}
                            className={`vote-limit-preset ${votesPerUser === val ? 'active' : ''}`}
                            onClick={() => updateVotesPerUser(val)}
                          >
                            {val}
                          </button>
                        ))}
                        <div className={`vote-limit-custom-inline ${votesPerUser > 0 && ![3, 5, 10].includes(votesPerUser) ? 'active' : ''}`}>
                          <input
                            type="number"
                            className="vote-limit-input"
                            min="1"
                            max="99"
                            value={votesPerUser > 0 && ![3, 5, 10].includes(votesPerUser) ? votesPerUser : ''}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val > 0) {
                                updateVotesPerUser(val);
                              }
                            }}
                            onBlur={e => {
                               const val = parseInt(e.target.value, 10);
                               if (isNaN(val) || val <= 0) {
                                 if (votesPerUser > 0 && ![3, 5, 10].includes(votesPerUser)) {
                                    updateVotesPerUser(0);
                                 }
                               }
                            }}
                            placeholder="#"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="settings-divider" />

                    <button
                      className="settings-reset-votes-btn"
                      onClick={() => {
                        if (resetAllVotes()) {
                          showNotification('All votes reset to zero');
                        }
                      }}
                    >
                      <RotateCcw size={12} />
                      Reset all votes
                    </button>
                  </>
                )}
              </div>

              {/* Board Features Tab */}
              <div
                id="settings-tabpanel-features"
                role="tabpanel"
                aria-labelledby="settings-tab-features"
                className="settings-tabpanel"
                hidden={activeTab !== 'features'}
              >
                <div className="settings-section">
                  <div className="settings-toggle-row">
                    <span className="settings-toggle-label">
                      <EyeOff size={14} aria-hidden="true" className="settings-toggle-icon" />
                      Retrospective mode
                    </span>
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
                    New cards appear with hidden text until revealed
                  </p>
                </div>

                <div className="settings-section">
                  <div className="settings-toggle-row">
                    <span className="settings-toggle-label">
                      <Monitor size={14} aria-hidden="true" className="settings-toggle-icon" />
                      Screen sharing mode
                    </span>
                    <button
                      className="settings-toggle-switch"
                      role="switch"
                      aria-checked={hideCardAuthorship}
                      onClick={() => updateHideCardAuthorship(!hideCardAuthorship)}
                      aria-label="Screen sharing mode"
                    >
                      <span className="settings-toggle-knob"></span>
                    </button>
                  </div>
                  <p className="settings-hint">
                    Hides the colored marker on cards you created
                  </p>
                </div>

                <div className="settings-section">
                  <div className="settings-toggle-row">
                    <span className="settings-toggle-label">
                      <Users size={14} aria-hidden="true" className="settings-toggle-icon" />
                      Display names
                    </span>
                    <button
                      className="settings-toggle-switch"
                      role="switch"
                      aria-checked={showDisplayNames}
                      onClick={() => updateShowDisplayNames(!showDisplayNames)}
                      aria-label="Show display names on board"
                    >
                      <span className="settings-toggle-knob"></span>
                    </button>
                  </div>
                  <p className="settings-hint">
                    Show author names and avatars on cards and comments
                  </p>
                </div>

                <div className="settings-section">
                  <div className="settings-toggle-row">
                    <span className="settings-toggle-label">
                      <CheckSquare size={14} aria-hidden="true" className="settings-toggle-icon" />
                      Action items
                    </span>
                    <button
                      className="settings-toggle-switch"
                      role="switch"
                      aria-checked={actionItemsEnabled}
                      onClick={() => updateActionItemsEnabled(!actionItemsEnabled)}
                      aria-label="Enable action items"
                    >
                      <span className="settings-toggle-knob"></span>
                    </button>
                  </div>
                  <p className="settings-hint">
                    Convert cards into trackable action items with assignees and due dates
                  </p>
                </div>

                <div className="settings-divider" />

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
              </div>

              {/* Share & Export Tab */}
              <div
                id="settings-tabpanel-share"
                role="tabpanel"
                aria-labelledby="settings-tab-share"
                className="settings-tabpanel"
                hidden={activeTab !== 'share'}
              >
                <div className="settings-section">
                  <div className="settings-share-actions">
                    <button
                      className="settings-share-action-btn"
                      onClick={() => {
                        copyShareUrl();
                        setSortDropdownOpen(false);
                      }}
                    >
                      <div className="settings-share-action-icon">
                        <Link size={20} aria-hidden="true" />
                      </div>
                      <div className="settings-share-action-text">
                        <span className="settings-share-action-title">Share Board</span>
                        <span className="settings-share-action-desc">Copy the board link to share with others</span>
                      </div>
                      <ChevronRight size={16} className="settings-share-action-chevron" aria-hidden="true" />
                    </button>
                    <button
                      className="settings-share-action-btn"
                      onClick={() => {
                        handleExportBoard();
                        setSortDropdownOpen(false);
                      }}
                    >
                      <div className="settings-share-action-icon">
                        <FileText size={20} aria-hidden="true" />
                      </div>
                      <div className="settings-share-action-text">
                        <span className="settings-share-action-title">Export Board</span>
                        <span className="settings-share-action-desc">Download board content as a file</span>
                      </div>
                      <ChevronRight size={16} className="settings-share-action-chevron" aria-hidden="true" />
                    </button>
                    {actionItemsEnabled && (
                      <button
                        className="settings-share-action-btn"
                        onClick={() => {
                          if (onOpenActionItems) onOpenActionItems();
                        }}
                      >
                        <div className="settings-share-action-icon">
                          <CheckSquare size={20} aria-hidden="true" />
                        </div>
                        <div className="settings-share-action-text">
                          <span className="settings-share-action-title">
                            Action Items
                            {actionItemCount > 0 && <span className="action-items-count-badge">{actionItemCount}</span>}
                          </span>
                          <span className="settings-share-action-desc">View and manage action items</span>
                        </div>
                        <ChevronRight size={16} className="settings-share-action-chevron" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
