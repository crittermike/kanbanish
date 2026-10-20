import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Activity, BarChart2, Layers, MessageCircle, Play, Plus, ThumbsUp } from 'react-feather';
import { useBoardContext } from '../../context/BoardContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';

/**
 * Shows the steps that ▶ will run, with switches for the optional first
 * (health check) and last (poll) steps. Options are remembered on the board.
 */
const StartStepsModal = ({ isOpen, onClose }) => {
  const { startFlow, flowHealthCheck, flowPoll, updateFlowHealthCheck, updateFlowPoll } = useBoardContext();
  const modalRef = useRef(null);
  const startRef = useRef(null);

  useFocusTrap(modalRef, isOpen, { onClose });

  useEffect(() => {
    if (!isOpen) return undefined;
    // Runs after the focus trap's initial focus so Enter starts right away
    const timer = setTimeout(() => startRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    { icon: Activity, label: 'Health check', optional: true, on: !!flowHealthCheck, toggle: updateFlowHealthCheck },
    { icon: Plus, label: 'Add' },
    { icon: Layers, label: 'Group' },
    { icon: ThumbsUp, label: 'Vote' },
    { icon: MessageCircle, label: 'Discuss' },
    { icon: BarChart2, label: 'Poll', optional: true, on: !!flowPoll, toggle: updateFlowPoll }
  ];

  const handleStart = () => {
    startFlow();
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-container start-steps-modal"
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Start"
      >
        <ol className="start-steps">
          {steps.map(({ icon: Icon, label, optional, on, toggle }) => (
            <li key={label} className={`start-step${optional && !on ? ' start-step-off' : ''}`}>
              <Icon size={16} aria-hidden="true" />
              <span className="start-step-label">{label}</span>
              {optional && (
                <button
                  type="button"
                  className="settings-toggle-switch"
                  role="switch"
                  aria-checked={on}
                  aria-label={label}
                  onClick={() => toggle(!on)}
                >
                  <span className="settings-toggle-knob" />
                </button>
              )}
            </li>
          ))}
        </ol>
        <div className="modal-footer">
          <button type="button" className="btn secondary-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="btn primary-btn btn-with-icon" onClick={handleStart} ref={startRef}>
            <Play size={14} aria-hidden="true" /> Start
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StartStepsModal;
