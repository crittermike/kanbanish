import { Pause, Play, Square } from 'react-feather';
import { useCardTimer } from '../hooks/useCardTimer';

const TIMER_PRESETS = [
  { label: '1m', seconds: 60 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 }
];

const formatTime = (seconds) => {
  if (seconds == null) {
    return '00:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

const CardTimerControls = ({
  boardId,
  columnId,
  cardId,
  timerData,
  user,
  className = ''
}) => {
  const {
    startCardTimer,
    pauseCardTimer,
    resumeCardTimer,
    resetCardTimer,
    remainingSeconds,
    isRunning,
    isPaused,
    hasTimer
  } = useCardTimer({
    boardId,
    columnId,
    cardId,
    timerData,
    user
  });

  const timerClass = [
    hasTimer && isRunning ? 'active' : '',
    hasTimer && remainingSeconds !== null && remainingSeconds <= 30 && remainingSeconds > 0 ? 'warning' : '',
    remainingSeconds === 0 ? 'expired' : ''
  ].filter(Boolean).join(' ');
  const totalDuration = timerData?.originalDuration || timerData?.duration || 0;
  const progressPercent = totalDuration > 0 && remainingSeconds !== null
    ? Math.max(0, 100 - (remainingSeconds / totalDuration) * 100)
    : 0;
  const containerClassName = ['card-detail-timer', className].filter(Boolean).join(' ');

  return (
    <div className={containerClassName}>
      <div className="card-detail-timer-display-wrapper">
        <div className={`card-detail-timer-display ${timerClass}`} role="timer" aria-live="polite">
          {formatTime(remainingSeconds)}
        </div>

        <div className="card-detail-timer-presets">
          {TIMER_PRESETS.map(({ label, seconds }) => (
            <button
              key={seconds}
              className="card-detail-timer-btn"
              onClick={() => startCardTimer(seconds)}
              disabled={isRunning && !isPaused}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card-detail-timer-controls">
        {hasTimer && isRunning && (
          <button className="card-detail-timer-btn icon-only" onClick={pauseCardTimer} title="Pause">
            <Pause size={16} />
          </button>
        )}
        {hasTimer && isPaused && (
          <button className="card-detail-timer-btn icon-only" onClick={resumeCardTimer} title="Resume">
            <Play size={16} />
          </button>
        )}
        {hasTimer && (
          <button className="card-detail-timer-btn icon-only" onClick={resetCardTimer} title="Reset">
            <Square size={16} />
          </button>
        )}
      </div>

      {hasTimer && (
        <div className="card-detail-timer-progress">
          <div
            className={`card-detail-timer-progress-bar ${timerClass}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default CardTimerControls;
