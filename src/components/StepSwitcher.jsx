import { Fragment } from 'react';
import { ChevronRight, Columns } from 'react-feather';
import { BOARD, STEPS, useSteps } from '../hooks/useSteps';

/**
 * Header control that switches between the plain board and the
 * Health → Add → Group → Vote → Discuss → Poll steps. Picking a step
 * starts a run; picking Board ends it.
 */
const StepSwitcher = () => {
  const { current, select } = useSteps();

  const ariaCurrent = id => (id === current ? 'step' : undefined);
  const className = id => `step-switch-btn${id === current ? ' active' : ''}`;

  return (
    <div className="step-switch">
      <div className="step-switch-pills" role="group" aria-label="Steps">
        <div className="step-switch-segments">
          <button
            type="button"
            className={`${className(BOARD)} step-switch-board`}
            aria-current={ariaCurrent(BOARD)}
            onClick={() => select(BOARD)}
          >
            <Columns size={14} aria-hidden="true" />
            Board
          </button>
        </div>
        <div className="step-switch-segments">
          {STEPS.map((step, index) => (
            <Fragment key={step.id}>
              {index > 0 && <ChevronRight className="step-switch-chevron" size={12} aria-hidden="true" />}
              <button
                type="button"
                className={className(step.id)}
                aria-current={ariaCurrent(step.id)}
                onClick={() => select(step.id)}
              >
                {step.label}
              </button>
            </Fragment>
          ))}
        </div>
      </div>
      <select
        className="step-switch-select"
        aria-label="Step"
        value={current}
        onChange={event => select(event.target.value)}
      >
        <option value={BOARD}>Board</option>
        {STEPS.map(step => (
          <option key={step.id} value={step.id}>{step.label}</option>
        ))}
      </select>
    </div>
  );
};

export default StepSwitcher;
