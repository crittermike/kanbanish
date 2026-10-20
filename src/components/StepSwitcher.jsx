import { Fragment } from 'react';
import { ChevronRight, Columns } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { WORKFLOW_PHASES, isCardFromCurrentRun } from '../utils/workflowUtils';

const BOARD = 'board';

const STEPS = [
  { id: 'health', label: 'Health', phase: WORKFLOW_PHASES.HEALTH_CHECK, phases: [WORKFLOW_PHASES.HEALTH_CHECK, WORKFLOW_PHASES.HEALTH_CHECK_RESULTS] },
  { id: 'add', label: 'Add', phase: WORKFLOW_PHASES.CREATION, phases: [WORKFLOW_PHASES.CREATION] },
  { id: 'group', label: 'Group', phase: WORKFLOW_PHASES.GROUPING, phases: [WORKFLOW_PHASES.GROUPING] },
  { id: 'vote', label: 'Vote', phase: WORKFLOW_PHASES.INTERACTIONS, phases: [WORKFLOW_PHASES.INTERACTIONS] },
  { id: 'discuss', label: 'Discuss', phase: WORKFLOW_PHASES.RESULTS, phases: [WORKFLOW_PHASES.RESULTS] },
  { id: 'poll', label: 'Poll', phase: WORKFLOW_PHASES.POLL, phases: [WORKFLOW_PHASES.POLL, WORKFLOW_PHASES.POLL_RESULTS] }
];
const HEALTH_OR_POLL = ['health', 'poll'];

/**
 * Header control that switches between the plain board and the
 * Health → Add → Group → Vote → Discuss → Poll steps. Picking a step
 * starts a run; picking Board ends it.
 */
const StepSwitcher = () => {
  const {
    workflowPhase,
    retrospectiveMode,
    columns,
    flowStartedAt,
    goToPhase,
    endFlow
  } = useBoardContext();

  const activeStep = STEPS.find(step => step.phases.includes(workflowPhase));
  // A template can open a health check without starting the steps
  const current = retrospectiveMode || HEALTH_OR_POLL.includes(activeStep?.id) ? activeStep?.id ?? BOARD : BOARD;

  const selectBoard = () => {
    if (current === BOARD) {
      return;
    }
    // Ending during Add reveals cards that are still hidden
    const hasHiddenCards = retrospectiveMode && workflowPhase === WORKFLOW_PHASES.CREATION &&
      Object.values(columns || {}).some(column =>
        Object.values(column.cards || {}).some(card => isCardFromCurrentRun(card, flowStartedAt)));
    if (hasHiddenCards && !window.confirm('End now? Hidden cards will be revealed.')) {
      return;
    }
    endFlow();
  };

  const select = id => {
    if (id === BOARD) {
      selectBoard();
      return;
    }
    if (id === current) {
      return;
    }
    goToPhase(STEPS.find(step => step.id === id).phase);
  };

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
