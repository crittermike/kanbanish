import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Clock, Pause, Play, RotateCcw, Square, X } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { useNotification } from '../context/NotificationContext';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { playDing } from '../utils/sound';

/* global requestAnimationFrame, cancelAnimationFrame */

const PRESET_DURATIONS = [
  { label: '1m', seconds: 60 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 }
];

const formatDurationLabel = (seconds) => {
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60}m`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m${seconds % 60}s`;
  return `${seconds}s`;
};
const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const formatTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getUrgencyState = (remaining, total) => {
  if (total === 0) return 'normal';
  const ratio = remaining / total;
  if (ratio <= 0) return 'expired';
  if (ratio <= 0.2) return 'critical';
  if (ratio <= 0.5) return 'warning';
  return 'normal';
};

const ColumnTimer = ({ columnId, timerData, defaultTimerSeconds }) => {
  const { startColumnTimer, pauseColumnTimer, resumeColumnTimer, resetColumnTimer, restartColumnTimer, setColumnDefaultTimer } = useBoardContext();
  const { showNotification } = useNotification();

  const [remaining, setRemaining] = useState(0);
  const [showSetup, setShowSetup] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  const hasNotifiedRef = useRef(false);
  const animationRef = useRef(null);
  const setupRef = useRef(null);
  const lastStartedAtRef = useRef(null);

  useOnClickOutside(setupRef, () => setShowSetup(false));

  const updateRemaining = useCallback(() => {
    if (!timerData) {
      setRemaining(0);
      return;
    }

    let newRemaining = 0;
    if (timerData.isRunning && timerData.startedAt) {
      const now = Date.now();
      const elapsed = Math.floor((now - timerData.startedAt) / 1000);
      newRemaining = Math.max(0, timerData.duration - elapsed);
    } else if (timerData.pausedRemaining !== undefined && timerData.pausedRemaining !== null) {
      newRemaining = timerData.pausedRemaining;
    } else {
      newRemaining = timerData.duration;
    }

    setRemaining(newRemaining);

    if (
      newRemaining <= 0 &&
      !hasNotifiedRef.current &&
      (timerData.isRunning || (timerData.pausedRemaining !== undefined && timerData.pausedRemaining <= 0))
    ) {
      hasNotifiedRef.current = true;
      playDing();
      showNotification("⏰ Time's up!", 'info');
    }
  }, [timerData, showNotification]);

  useEffect(() => {
    if (timerData?.startedAt !== lastStartedAtRef.current) {
      hasNotifiedRef.current = false;
      lastStartedAtRef.current = timerData?.startedAt;
    }

    updateRemaining();

    if (timerData?.isRunning) {
      const loop = () => {
        updateRemaining();
        animationRef.current = requestAnimationFrame(loop);
      };
      animationRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [timerData, updateRemaining]);

  const handleStartPreset = (seconds) => {
    startColumnTimer(columnId, seconds);
    setShowSetup(false);
    hasNotifiedRef.current = false;
  };

  const handleStartCustom = () => {
    const mins = parseFloat(customMinutes);
    if (mins > 0 && mins <= 60) {
      startColumnTimer(columnId, Math.round(mins * 60));
      setShowSetup(false);
      hasNotifiedRef.current = false;
    }
  };

  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleStartCustom();
    }
  };

  const handleRestart = () => {
    restartColumnTimer(columnId, timerData);
    hasNotifiedRef.current = false;
  };

  const handleStop = () => {
    resetColumnTimer(columnId);
    hasNotifiedRef.current = false;
  };

  const totalDuration = timerData?.originalDuration || timerData?.duration || 0;
  const progress = totalDuration > 0 ? remaining / totalDuration : 0;
  const dashoffset = RING_CIRCUMFERENCE * (1 - progress);
  const urgency = getUrgencyState(remaining, totalDuration);
  const isRunning = timerData?.isRunning || false;
  const isPaused = timerData && !timerData.isRunning && timerData.pausedRemaining > 0;
  const hasTimer = timerData != null;
  const timerExpired = hasTimer && remaining <= 0 && (isRunning || (timerData?.pausedRemaining !== null && timerData?.pausedRemaining <= 0));

  if (!hasTimer) {
    // Quick-start: if a default is set, clicking the clock icon starts immediately
    const handleQuickStart = () => {
      if (defaultTimerSeconds) {
        startColumnTimer(columnId, defaultTimerSeconds);
        hasNotifiedRef.current = false;
      }
    };

    if (defaultTimerSeconds) {
      return (
        <div className="column-timer-setup" ref={setupRef}>
          <button
            className="icon-button column-timer-btn column-timer-quick-start"
            onClick={handleQuickStart}
            title={`Start ${formatDurationLabel(defaultTimerSeconds)} timer`}
          >
            <Clock />
            <span className="column-timer-default-label">{formatDurationLabel(defaultTimerSeconds)}</span>
          </button>
          <button
            className="icon-button column-timer-expand-btn"
            onClick={() => setShowSetup(!showSetup)}
            title="Choose a different duration"
            aria-label="Choose a different timer duration"
          >
            <ChevronDown size={10} />
          </button>
          {showSetup && (
            <div className="column-timer-popover">
              <div className="column-timer-popover-header">
                <span className="column-timer-popover-title">Set Timer</span>
              </div>
              <div className="column-timer-presets">
                {PRESET_DURATIONS.map(({ label, seconds }) => (
                  <button key={seconds} className="btn column-timer-preset-btn" onClick={() => handleStartPreset(seconds)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="column-timer-custom">
                <input type="number" className="column-timer-custom-input" placeholder="min" min="0.5" max="60" step="0.5" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} onKeyDown={handleCustomKeyDown} aria-label="Custom timer duration in minutes" />
                <button className="btn primary-btn column-timer-custom-start" onClick={handleStartCustom} disabled={!customMinutes || parseFloat(customMinutes) <= 0}>
                  <Play size={12} />
                </button>
              </div>
              <div className="column-timer-default-section">
                <div className="column-timer-default-header">
                  <span className="column-timer-popover-title">Column Default</span>
                </div>
                <div className="column-timer-default-current">
                  <span className="column-timer-default-value">{formatDurationLabel(defaultTimerSeconds)}</span>
                  <button
                    className="btn column-timer-clear-default"
                    onClick={() => { setColumnDefaultTimer(columnId, null); setShowSetup(false); }}
                    title="Clear default timer"
                  >
                    <X size={10} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="column-timer-setup" ref={setupRef}>
        <button className="icon-button column-timer-btn" onClick={() => setShowSetup(!showSetup)} title="Set column timer">
          <Clock />
        </button>
        {showSetup && (
          <div className="column-timer-popover">
            <div className="column-timer-popover-header">
              <span className="column-timer-popover-title">Set Timer</span>
            </div>
            <div className="column-timer-presets">
              {PRESET_DURATIONS.map(({ label, seconds }) => (
                <button key={seconds} className="btn column-timer-preset-btn" onClick={() => handleStartPreset(seconds)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="column-timer-custom">
              <input type="number" className="column-timer-custom-input" placeholder="min" min="0.5" max="60" step="0.5" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} onKeyDown={handleCustomKeyDown} aria-label="Custom timer duration in minutes" />
              <button className="btn primary-btn column-timer-custom-start" onClick={handleStartCustom} disabled={!customMinutes || parseFloat(customMinutes) <= 0}>
                <Play size={12} />
              </button>
            </div>
            <div className="column-timer-default-section">
              <div className="column-timer-default-header">
                <span className="column-timer-popover-title">Set Column Default</span>
              </div>
              <div className="column-timer-default-presets">
                {PRESET_DURATIONS.map(({ label, seconds }) => (
                  <button
                    key={seconds}
                    className="btn column-timer-default-preset-btn"
                    onClick={() => { setColumnDefaultTimer(columnId, seconds); setShowSetup(false); }}
                  >
                    <Check size={10} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`column-timer-active ${urgency} ${timerExpired ? 'expired' : ''}`} role="timer" aria-live="polite" aria-label={`${formatTime(remaining)} remaining`}>
      <div className="column-timer-ring">
        <svg className="column-timer-svg" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="column-timer-ring-bg" cx="50" cy="50" r={RING_RADIUS} />
          <circle className="column-timer-ring-progress" cx="50" cy="50" r={RING_RADIUS} strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={dashoffset} />
        </svg>
        <div className="column-timer-display">
          <span className="column-timer-time">{formatTime(remaining)}</span>
        </div>
      </div>
      <div className="column-timer-controls">
        {isRunning && remaining > 0 ? (
          <button className="btn icon-btn column-timer-control-btn" onClick={() => pauseColumnTimer(columnId, timerData)} title="Pause" aria-label="Pause timer">
            <Pause size={14} />
          </button>
        ) : isPaused && remaining > 0 ? (
          <button className="btn icon-btn column-timer-control-btn" onClick={() => resumeColumnTimer(columnId, timerData)} title="Resume" aria-label="Resume timer">
            <Play size={14} />
          </button>
        ) : null}
        <button className="btn icon-btn column-timer-control-btn" onClick={handleRestart} title="Restart" aria-label="Restart timer">
          <RotateCcw size={14} />
        </button>
        <button className="btn icon-btn column-timer-control-btn" onClick={handleStop} title="Stop" aria-label="Stop timer">
          <Square size={14} />
        </button>
      </div>
    </div>
  );
};

export default ColumnTimer;
