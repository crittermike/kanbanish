import { ChevronLeft, ChevronRight } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { BOARD, STEPS, useSteps } from '../hooks/useSteps';
import { getPhaseDescription } from '../utils/workflowUtils';

/**
 * Explains the current step and moves to the previous or next one.
 * Next on the last step ends the run.
 */
const StepBanner = () => {
  const { workflowPhase } = useBoardContext();
  const { current, select } = useSteps();

  if (current === BOARD) {
    return null;
  }

  const index = STEPS.findIndex(step => step.id === current);
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];

  return (
    <div className="step-banner">
      <div className="step-banner-side">
        {previous && (
          <button
            type="button"
            className="step-banner-btn"
            onClick={() => select(previous.id)}
            aria-label={`Back to ${previous.label}`}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            <span className="step-banner-btn-label">{previous.label}</span>
          </button>
        )}
      </div>
      <p className="step-banner-text">{getPhaseDescription(workflowPhase)}</p>
      <div className="step-banner-side step-banner-side-end">
        <button
          type="button"
          className="step-banner-btn step-banner-next"
          onClick={() => select(next ? next.id : BOARD)}
          aria-label={next ? `Next: ${next.label}` : 'Finish'}
        >
          <span className="step-banner-btn-label">{next ? next.label : 'Finish'}</span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default StepBanner;
