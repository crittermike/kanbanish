/* global requestAnimationFrame, cancelAnimationFrame */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Play, Pause, RotateCcw, Square, X } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';

const PRESET_DURATIONS = [
  { label: '1m', seconds: 60 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 }
];

const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const playDing = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    // Fundamental tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 1.2);

    // Harmonic overtone for bell character
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, now);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.8);
  } catch {
    // Web Audio API not available
  }
};

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

const Timer = ({ showNotification }) => {
  const {
    timerData,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    restartTimer
  } = useBoardContext();

  const [remaining, setRemaining] = useState(0);
  const [showSetup, setShowSetup] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const hasNotifiedRef = useRef(false);
  const animationRef = useRef(null);
  const setupRef = useRef(null);

  // Handle clicking outside the setup popover
  useEffect(() => {
    const handleClickOutside = event => {
      if (setupRef.current && !setupRef.current.contains(event.target)) {
        setShowSetup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Compute remaining time from timer data
  const updateRemaining = useCallback(() => {
    if (!timerData) {
      setRemaining(0);
      return;
    }

    if (timerData.isRunning && timerData.startedAt) {
      const elapsed = (Date.now() - timerData.startedAt) / 1000;
      const timeLeft = Math.max(0, timerData.duration - elapsed);
      setRemaining(timeLeft);

      if (timeLeft <= 0 && !hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        playDing();
        if (showNotification) {
          showNotification('⏰ Time\'s up!');
        }
      }
    } else if (timerData.pausedRemaining !== null && timerData.pausedRemaining !== undefined) {
      setRemaining(timerData.pausedRemaining);
    } else {
      setRemaining(0);
    }
  }, [timerData, showNotification]);

  // Animation loop for smooth countdown
  useEffect(() => {
    if (timerData?.isRunning) {
      // Only reset notification guard when a fresh timer starts (new startedAt)
      hasNotifiedRef.current = false;
      updateRemaining();
      const tick = () => {
        updateRemaining();
        animationRef.current = requestAnimationFrame(tick);
      };
      animationRef.current = requestAnimationFrame(tick);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      updateRemaining();
    }
  }, [timerData, updateRemaining]);

  const handleStartPreset = (seconds) => {
    startTimer(seconds);
    setShowSetup(false);
    hasNotifiedRef.current = false;
  };

  const handleStartCustom = () => {
    const mins = parseFloat(customMinutes);
    if (mins > 0 && mins <= 60) {
      startTimer(Math.round(mins * 60));
      setShowSetup(false);
      setCustomMinutes('');
      hasNotifiedRef.current = false;
    }
  };

  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleStartCustom();
    }
  };

  const handleRestart = () => {
    restartTimer();
    hasNotifiedRef.current = false;
  };

  const handleStop = () => {
    resetTimer();
    hasNotifiedRef.current = false;
  };

  const totalDuration = timerData?.duration || 0;
  const progress = totalDuration > 0 ? remaining / totalDuration : 0;
  const dashoffset = RING_CIRCUMFERENCE * (1 - progress);
  const urgency = getUrgencyState(remaining, totalDuration);
  const isRunning = timerData?.isRunning || false;
  const isPaused = timerData && !timerData.isRunning && timerData.pausedRemaining > 0;
  const hasTimer = timerData != null;

  // Timer is expired when running timer reaches zero
  const timerExpired = hasTimer && remaining <= 0 && (isRunning || (timerData?.pausedRemaining !== null && timerData?.pausedRemaining <= 0));

  // If no active timer, show setup UI for everyone
  if (!hasTimer) {
    return (
      <div className="timer-setup-container" ref={setupRef}>
        <button
          className="btn icon-btn timer-start-btn"
          onClick={() => setShowSetup(!showSetup)}
          title="Set timer"
        >
          <Clock size={16} />
        </button>
        {showSetup && (
          <div className="timer-setup-popover">
            <div className="timer-presets">
              {PRESET_DURATIONS.map(({ label, seconds }) => (
                <button
                  key={seconds}
                  className="btn timer-preset-btn"
                  onClick={() => handleStartPreset(seconds)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="timer-custom">
              <input
                type="number"
                className="timer-custom-input"
                placeholder="min"
                min="0.5"
                max="60"
                step="0.5"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                aria-label="Custom timer duration in minutes"
              />
              <button
                className="btn primary-btn timer-custom-start"
                onClick={handleStartCustom}
                disabled={!customMinutes || parseFloat(customMinutes) <= 0}
              >
                <Play size={14} />
              </button>
            </div>
            <button
              className="btn icon-btn timer-setup-close"
              onClick={() => setShowSetup(false)}
              title="Cancel"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    );
  }
  // Active timer display (visible to all users)
  return (
    <div
      className={`timer-container timer-active ${urgency} ${timerExpired ? 'expired' : ''}`}
      role="timer"
      aria-live="polite"
      aria-label={`${formatTime(remaining)} remaining`}
    >
      <div className="timer-ring-container">
        <svg
          className="timer-svg"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          {/* Background ring */}
          <circle
            className="timer-ring-bg"
            cx="50"
            cy="50"
            r={RING_RADIUS}
          />
          {/* Progress ring */}
          <circle
            className="timer-ring-progress"
            cx="50"
            cy="50"
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashoffset}
          />
        </svg>
        <div className="timer-display">
          <span className="timer-time">{formatTime(remaining)}</span>
        </div>
      </div>

      <div className="timer-controls">
        {isRunning && remaining > 0 ? (
          <button
            className="btn icon-btn timer-control-btn"
            onClick={pauseTimer}
            title="Pause timer"
            aria-label="Pause timer"
          >
            <Pause size={14} />
          </button>
        ) : isPaused && remaining > 0 ? (
          <button
            className="btn icon-btn timer-control-btn"
            onClick={resumeTimer}
            title="Resume timer"
            aria-label="Resume timer"
          >
            <Play size={14} />
          </button>
        ) : null}
        <button
          className="btn icon-btn timer-control-btn timer-reset-btn"
          onClick={handleRestart}
          title="Restart timer"
          aria-label="Restart timer"
        >
          <RotateCcw size={14} />
        </button>
        <button
          className="btn icon-btn timer-control-btn timer-stop-btn"
          onClick={handleStop}
          title="Stop timer"
          aria-label="Stop timer"
        >
          <Square size={14} />
        </button>
      </div>
    </div>
  );
};

export default Timer;
