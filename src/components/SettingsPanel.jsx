import { useCallback, useEffect, useState } from 'react';
import { Settings } from 'react-feather';
import BackgroundPicker from './BackgroundPicker';
import BoardActionsMenu from './BoardActionsMenu';
import FlowStartButton from './FlowStartButton';
import Timer from './Timer';

const VOTE_PRESETS = [3, 5, 10];

const ToggleRow = ({ label, checked, onChange, ariaLabel, hint }) => (
  <div className="settings-row">
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

/**
 * Header actions (start steps, timer, board actions menu) and the Board Settings modal.
 * Settings holds board preferences only; sort, theme and one-off actions live in the board actions menu.
 */
const SettingsPanel = ({
  showFlowStart,
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
  sortDropdownOpen,
  setSortDropdownOpen,
  showSort,
  sortByVotes,
  setSortByVotes,
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
  // Voting is always on while the steps are running
  const votingActive = votingEnabled || retrospectiveMode;
  const isCustomVoteLimit = votesPerUser > 0 && !VOTE_PRESETS.includes(votesPerUser);
  const hasBackground = !!backgroundId && backgroundId !== 'none';
  const [backgroundOpen, setBackgroundOpen] = useState(hasBackground);

  // Sync the background toggle with the board each time the modal opens
  useEffect(() => {
    if (sortDropdownOpen) {
      setBackgroundOpen(hasBackground);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortDropdownOpen]);

  const handleBackgroundToggle = (on) => {
    setBackgroundOpen(on);
    if (!on && hasBackground) {
      setBoardBackground('none');
    }
  };

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
      {showFlowStart && <FlowStartButton />}
      <Timer />
      {children}
      <BoardActionsMenu
        showSort={showSort}
        sortByVotes={sortByVotes}
        onSortChange={setSortByVotes}
        onShare={copyShareUrl}
        darkMode={darkMode}
        onToggleDarkMode={updateDarkMode}
        onStartHealthCheck={handleStartHealthCheck}
        onExportBoard={handleExportBoard}
        onStartNextBoard={onStartNextBoard}
        onOpenLinkPrevious={onOpenLinkPrevious}
        onUnlinkSeries={onUnlinkSeries}
        inSeries={!!(previousBoardId || nextBoardId)}
        onResetVotes={votingActive ? resetAllVotes : null}
      />
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

            <div className="modal-body settings-content">
              <section className="settings-group" aria-labelledby="settings-group-voting">
                <h3 id="settings-group-voting" className="settings-group-title">Voting</h3>

                {!retrospectiveMode && (
                  <ToggleRow
                    label="Allow voting"
                    checked={votingEnabled}
                    onChange={updateVotingEnabled}
                  />
                )}

                {votingActive && (
                  <>
                    <div className="settings-row settings-vote-limit">
                      <span className="settings-toggle-label" id="votes-per-person-label">Votes per person</span>
                      <div className="vote-limit-preset-buttons" role="group" aria-labelledby="votes-per-person-label">
                        <button
                          className={`vote-limit-preset ${votesPerUser === 0 ? 'active' : ''}`}
                          aria-pressed={votesPerUser === 0}
                          onClick={() => updateVotesPerUser(0)}
                        >
                          Unlimited
                        </button>
                        {VOTE_PRESETS.map(val => (
                          <button
                            key={val}
                            className={`vote-limit-preset ${votesPerUser === val ? 'active' : ''}`}
                            aria-pressed={votesPerUser === val}
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
              </section>

              <section className="settings-group" aria-labelledby="settings-group-board">
                <h3 id="settings-group-board" className="settings-group-title">Board</h3>

                <ToggleRow
                  label="Anonymous"
                  checked={!showDisplayNames}
                  onChange={(anonymous) => updateShowDisplayNames(!anonymous)}
                />

                <ToggleRow
                  label="Custom background"
                  checked={backgroundOpen}
                  onChange={handleBackgroundToggle}
                />

                {backgroundOpen && (
                  <div className="settings-row settings-background">
                    <BackgroundPicker
                      currentBackgroundId={backgroundId}
                      onSelectBackground={setBoardBackground}
                      customBackgroundCss={customBackgroundCss}
                      onSetCustomBackground={setCustomBackground}
                      customBackgroundSize={customBackgroundSize}
                      onSetCustomBackgroundSize={setCustomBackgroundSize}
                    />
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
