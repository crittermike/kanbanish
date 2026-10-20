import { useBoardContext } from '../context/BoardContext';
import { WORKFLOW_PHASES, isCardFromCurrentRun } from '../utils/workflowUtils';

const BOARD = 'board';

const HEALTH_STEP = {
  id: 'health',
  label: 'Health',
  phase: WORKFLOW_PHASES.HEALTH_CHECK,
  phases: [WORKFLOW_PHASES.HEALTH_CHECK, WORKFLOW_PHASES.HEALTH_CHECK_RESULTS]
};
const POLL_STEP = {
  id: 'poll',
  label: 'Poll',
  phase: WORKFLOW_PHASES.POLL,
  phases: [WORKFLOW_PHASES.POLL, WORKFLOW_PHASES.POLL_RESULTS]
};
const FLOW_STEPS = [
  { id: 'add', label: 'Add', phase: WORKFLOW_PHASES.CREATION, phases: [WORKFLOW_PHASES.CREATION] },
  { id: 'group', label: 'Group', phase: WORKFLOW_PHASES.GROUPING, phases: [WORKFLOW_PHASES.GROUPING] },
  { id: 'vote', label: 'Vote', phase: WORKFLOW_PHASES.INTERACTIONS, phases: [WORKFLOW_PHASES.INTERACTIONS] },
  { id: 'discuss', label: 'Discuss', phase: WORKFLOW_PHASES.RESULTS, phases: [WORKFLOW_PHASES.RESULTS] }
];

/**
 * Header control that switches between the plain board and the
 * Add → Group → Vote → Discuss steps. Picking a step starts a run;
 * picking Board ends it.
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

  // Health check and poll only appear while one is open
  const steps = [
    ...(HEALTH_STEP.phases.includes(workflowPhase) ? [HEALTH_STEP] : []),
    ...FLOW_STEPS,
    ...(POLL_STEP.phases.includes(workflowPhase) ? [POLL_STEP] : [])
  ];
  const activeStep = steps.find(step => step.phases.includes(workflowPhase));
  const isSpecialStep = activeStep === HEALTH_STEP || activeStep === POLL_STEP;
  const current = retrospectiveMode || isSpecialStep ? activeStep?.id ?? BOARD : BOARD;

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
    goToPhase(steps.find(step => step.id === id).phase);
  };

  const options = [{ id: BOARD, label: 'Board' }, ...steps];

  return (
    <div className="step-switch">
      <div className="step-switch-segments" role="group" aria-label="Steps">
        {options.map(option => (
          <button
            key={option.id}
            type="button"
            className={`step-switch-btn${option.id === current ? ' active' : ''}`}
            aria-current={option.id === current ? 'step' : undefined}
            onClick={() => select(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <select
        className="step-switch-select"
        aria-label="Step"
        value={current}
        onChange={event => select(event.target.value)}
      >
        {options.map(option => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </div>
  );
};

export default StepSwitcher;
