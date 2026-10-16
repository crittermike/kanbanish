import { useCallback, useEffect, useState } from 'react';
import { Activity, FileText, Layers, Layout, Link2, Moon, RotateCcw, Scissors, Settings, Share2, Sliders, Sun } from 'react-feather';
import BackgroundPicker from './BackgroundPicker';
import Timer from './Timer';

const TABS = [
  { id: 'board', label: 'Board', icon: Layout },
  { id: 'advanced', label: 'Advanced', icon: Sliders },
];

const VOTE_PRESETS = [3, 5, 10];

const ToggleRow = ({ label, checked, onChange, ariaLabel, hint }) => (
  <div className="settings-section">
    <div className="settings-toggle-row">
      <span className="settings-toggle-label">{label}</span>
      <button
        className="settings-toggle-switch"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        aria-label={ariaLabel || label}
      >
        <span className="settings-toggle-knob"></span>
      </button>
    </div>
    {hint && <p className="settings-hint">{hint}</p>}
  </div>
);

const ActionButton = ({ icon: Icon, label, onClick }) => (
  <button className="settings-action-btn" onClick={onClick}>
    <Icon size={16} aria-hidden="true" />
    <span>{label}</span>
  </button>
);

/**
 * Header actions (timer, share, theme) and the Board Settings modal
 * with two tabs: Board and Advanced.
 */
const SettingsPanel = ({
  handleStartHealthCheck,
  copyShareUrl,
  handleExportBoard,
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
  showDisplayNames,
  updateShowDisplayNames,
  votesPerUser,
  updateVotesPerUser,
  children,
  backgroundId,
  setBoardBackground,
  customBackgroundCss,
  setCustomBackground,
  customBackgroundSize,
  setCustomBackgroundSize,
  previousBoardId,
  nextBoardId,
  onStartNextBoard,
  onOpenLinkPrevious,
  onUnlinkSeries
}) => {
  const [activeTab, setActiveTab] = useState('board');

  // Voting is always on in retrospective mode
  const votingActive = votingEnabled || retrospectiveMode;
  const isCustomVoteLimit = votesPerUser > 0 && !VOTE_PRESETS.includes(votesPerUser);

  // Reset to first tab whenever the modal opens
  useEffect(() => {
    if (sortDropdownOpen) {
      setActiveTab('board');
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
    const tabButton = document.getElementById(`settings-tab-${tabIds[newIndex]}`);
    if (tabButton) tabButton.focus();
  };

  const closeAnd = (fn) => () => {
    setSortDropdownOpen(false);
    if (fn) fn();
  };

  return (
    <div className="action-buttons">

      <Timer />
      {children}
      <button
        className="btn icon-btn share-board-btn"
        onClick={copyShareUrl}
        title="Copy board link"
        aria-label="Share board"
      >
        <Share2 size={16} aria-hidden="true" />
      </button>
      <button
        className="btn icon-btn theme-toggle-btn"
        onClick={() => updateDarkMode(!darkMode)}
        title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
        aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {darkMode ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      </button>
      <button
        id="settings-dropdown-button"
        className="btn icon-btn settings-toggle-btn"
        onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
        aria-expanded={sortDropdownOpen}
        aria-haspopup="dialog"
        title="Board settings"
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
              {/* Board Tab */}
              <div
                id="settings-tabpanel-board"
                role="tabpanel"
                aria-labelledby="settings-tab-board"
                className="settings-tabpanel"
                hidden={activeTab !== 'board'}
              >
                {!retrospectiveMode && (
                  <ToggleRow
                    label="Allow voting"
                    checked={votingEnabled}
                    onChange={updateVotingEnabled}
                  />
                )}

                {votingActive && (
                  <div className="settings-section settings-vote-limit">
                    <h4 className="settings-section-title">Votes per person</h4>
                    <div className="vote-limit-preset-buttons">
                      <button
                        className={`vote-limit-preset ${votesPerUser === 0 ? 'active' : ''}`}
                        onClick={() => updateVotesPerUser(0)}
                      >
                        Unlimited
                      </button>
                      {VOTE_PRESETS.map(val => (
                        <button
                          key={val}
                          className={`vote-limit-preset ${votesPerUser === val ? 'active' : ''}`}
                          onClick={() => updateVotesPerUser(val)}
                        >
                          {val}
                        </button>
                      ))}
                      <div className={`vote-limit-custom-inline ${isCustomVoteLimit ? 'active' : ''}`}>
                        <input
                          type="number"
                          className="vote-limit-input"
                          min="1"
                          max="99"
                          aria-label="Custom votes per person"
                          value={isCustomVoteLimit ? votesPerUser : ''}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val > 0) {
                              updateVotesPerUser(val);
                            }
                          }}
                          onBlur={e => {
                            const val = parseInt(e.target.value, 10);
                            if ((isNaN(val) || val <= 0) && isCustomVoteLimit) {
                              updateVotesPerUser(0);
                            }
                          }}
                          placeholder="#"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <ToggleRow
                  label="Anonymous"
                  checked={!showDisplayNames}
                  onChange={(anonymous) => updateShowDisplayNames(!anonymous)}
                />

                <div className="settings-section">
                  <div className="settings-action-list">
                    <ActionButton icon={Activity} label="Start Health Check" onClick={closeAnd(handleStartHealthCheck)} />
                  </div>
                </div>
              </div>

              {/* Advanced Tab */}
              <div
                id="settings-tabpanel-advanced"
                role="tabpanel"
                aria-labelledby="settings-tab-advanced"
                className="settings-tabpanel"
                hidden={activeTab !== 'advanced'}
              >
                {votingActive && (
                  <>
                    <ToggleRow
                      label="Allow downvoting"
                      checked={downvotingEnabled}
                      onChange={updateDownvotingEnabled}
                    />
                    <ToggleRow
                      label="Multiple votes per card"
                      ariaLabel="Allow users to vote multiple times on the same card"
                      checked={multipleVotesAllowed}
                      onChange={updateMultipleVotesAllowed}
                    />
                  </>
                )}

                <ToggleRow
                  label="Retrospective mode"
                  checked={retrospectiveMode}
                  onChange={updateRetrospectiveMode}
                  hint="Guided steps: add cards, group, vote, discuss"
                />

                <div className="settings-section">
                  <BackgroundPicker
                    currentBackgroundId={backgroundId}
                    onSelectBackground={setBoardBackground}
                    customBackgroundCss={customBackgroundCss}
                    onSetCustomBackground={setCustomBackground}
                    customBackgroundSize={customBackgroundSize}
                    onSetCustomBackgroundSize={setCustomBackgroundSize}
                  />
                </div>

                <div className="settings-section">
                  <div className="settings-action-list">
                    <ActionButton icon={FileText} label="Export board" onClick={closeAnd(handleExportBoard)} />
                    <ActionButton icon={Layers} label="Start next board" onClick={() => onStartNextBoard && onStartNextBoard()} />
                    <ActionButton icon={Link2} label="Link to previous board" onClick={() => onOpenLinkPrevious && onOpenLinkPrevious()} />
                    {(previousBoardId || nextBoardId) && (
                      <ActionButton icon={Scissors} label="Remove from series" onClick={() => onUnlinkSeries && onUnlinkSeries()} />
                    )}
                    {votingActive && (
                      <button
                        className="settings-action-btn settings-action-btn-danger"
                        onClick={resetAllVotes}
                      >
                        <RotateCcw size={16} aria-hidden="true" />
                        <span>Reset all votes</span>
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
