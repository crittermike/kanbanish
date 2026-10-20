import { useBoardContext } from '../context/BoardContext';
import { WORKFLOW_PHASES, isCardFromCurrentRun } from '../utils/workflowUtils';

export const BOARD = 'board';

export const STEPS = [
  { id: 'health', label: 'Health', phase: WORKFLOW_PHASES.HEALTH_CHECK, phases: [WORKFLOW_PHASES.HEALTH_CHECK, WORKFLOW_PHASES.HEALTH_CHECK_RESULTS] },
  { id: 'add', label: 'Add', phase: WORKFLOW_PHASES.CREATION, phases: [WORKFLOW_PHASES.CREATION] },
  { id: 'group', label: 'Group', phase: WORKFLOW_PHASES.GROUPING, phases: [WORKFLOW_PHASES.GROUPING] },
  { id: 'vote', label: 'Vote', phase: WORKFLOW_PHASES.INTERACTIONS, phases: [WORKFLOW_PHASES.INTERACTIONS] },
  { id: 'discuss', label: 'Discuss', phase: WORKFLOW_PHASES.RESULTS, phases: [WORKFLOW_PHASES.RESULTS] },
  { id: 'poll', label: 'Poll', phase: WORKFLOW_PHASES.POLL, phases: [WORKFLOW_PHASES.POLL, WORKFLOW_PHASES.POLL_RESULTS] }
];
const HEALTH_OR_POLL = ['health', 'poll'];

/**
 * The current step (or Board) and a way to switch to another one. Picking a
 * step starts a run; picking Board ends it.
 */
export const useSteps = () => {
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

  return { current, select };
};
