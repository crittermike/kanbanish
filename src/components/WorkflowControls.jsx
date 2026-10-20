import { ArrowLeft, ArrowRight, Check, Square } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import { WORKFLOW_PHASES, isCardFromCurrentRun } from '../utils/workflowUtils';

const HEALTH_PHASES = [WORKFLOW_PHASES.HEALTH_CHECK, WORKFLOW_PHASES.HEALTH_CHECK_RESULTS];

const STEPS = [
  { id: 'health', label: 'Health', phases: HEALTH_PHASES },
  { id: 'add', label: 'Add', phases: [WORKFLOW_PHASES.CREATION] },
  { id: 'group', label: 'Group', phases: [WORKFLOW_PHASES.GROUPING] },
  { id: 'vote', label: 'Vote', phases: [WORKFLOW_PHASES.INTERACTIONS] },
  { id: 'discuss', label: 'Discuss', phases: [WORKFLOW_PHASES.RESULTS] },
  { id: 'poll', label: 'Poll', phases: [WORKFLOW_PHASES.POLL, WORKFLOW_PHASES.POLL_RESULTS] }
];

const VOTE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const WorkflowControls = () => {
  const {
    workflowPhase,
    initialWorkflowPhase,
    retrospectiveMode,
    healthCheckVotes,
    flowHealthCheck,
    flowPoll,
    flowStartedAt,
    columns,
    votesPerUser,
    updateVotesPerUser,
    goToNextPhase,
    goToPreviousPhase,
    endFlow
  } = useBoardContext();

  const inHealthCheck = HEALTH_PHASES.includes(workflowPhase);
  const inPoll = workflowPhase === WORKFLOW_PHASES.POLL || workflowPhase === WORKFLOW_PHASES.POLL_RESULTS;
  // Runs started from the ▶ button record their options; older boards infer them
  const hasHealthCheck = inHealthCheck || (flowStartedAt
    ? !!flowHealthCheck
    : HEALTH_PHASES.includes(initialWorkflowPhase) || Object.keys(healthCheckVotes || {}).length > 0);
  const hasPoll = inPoll || !!flowPoll;

  // A standalone health check only shows its own step.
  const steps = !retrospectiveMode
    ? STEPS.filter(step => step.id === 'health')
    : STEPS.filter(step =>
      (step.id !== 'health' || hasHealthCheck) && (step.id !== 'poll' || hasPoll));

  const currentIndex = steps.findIndex(step => step.phases.includes(workflowPhase));
  if (currentIndex === -1) {
    return null;
  }

  const firstPhase = steps[0].phases[0];
  const canGoBack = workflowPhase !== firstPhase;
  const lastStep = steps[steps.length - 1];
  const isLastPhase = workflowPhase === lastStep.phases[lastStep.phases.length - 1];
  // Health check and poll reveal their results before moving on
  const nextIsResults = workflowPhase === WORKFLOW_PHASES.HEALTH_CHECK || workflowPhase === WORKFLOW_PHASES.POLL;

  const handleEnd = () => {
    // Ending during Add reveals cards that are still hidden
    const hasHiddenCards = workflowPhase === WORKFLOW_PHASES.CREATION &&
      Object.values(columns || {}).some(column =>
        Object.values(column.cards || {}).some(card => isCardFromCurrentRun(card, flowStartedAt)));
    if (hasHiddenCards && !window.confirm('End now? Hidden cards will be revealed.')) {
      return;
    }
    endFlow();
  };

  const voteOptions = votesPerUser > 0 && !VOTE_OPTIONS.includes(votesPerUser)
    ? [...VOTE_OPTIONS, votesPerUser].sort((a, b) => a - b)
    : VOTE_OPTIONS;

  return (
    <nav className="workflow-controls" aria-label="Steps">
      <div className="workflow-stepper">
        {canGoBack ? (
          <button
            type="button"
            className="workflow-back-btn"
            onClick={goToPreviousPhase}
            aria-label="Previous step"
            title="Previous step"
          >
            <ArrowLeft size={16} />
          </button>
        ) : (
          <span className="workflow-back-placeholder" aria-hidden="true" />
        )}

        <ol className="workflow-steps">
          {steps.map((step, index) => {
            const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
            return (
              <li
                key={step.id}
                className={`workflow-step workflow-step-${state}`}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                <span className="workflow-step-dot" aria-hidden="true" />
                <span className="workflow-step-label">{step.label}</span>
              </li>
            );
          })}
        </ol>

        <div className="workflow-actions">
          {workflowPhase === WORKFLOW_PHASES.INTERACTIONS && (
            <label className="workflow-votes">
              <span>Votes:</span>
              <select
                value={votesPerUser}
                onChange={e => updateVotesPerUser(parseInt(e.target.value, 10))}
                aria-label="Votes per person"
              >
                {voteOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
                <option value={0}>∞</option>
              </select>
            </label>
          )}
          <button
            type="button"
            className="btn primary-btn workflow-next-btn"
            onClick={goToNextPhase}
          >
            {isLastPhase ? (
              <>Done<Check size={16} aria-hidden="true" /></>
            ) : nextIsResults ? (
              <>Results<ArrowRight size={16} aria-hidden="true" /></>
            ) : (
              <>Next<ArrowRight size={16} aria-hidden="true" /></>
            )}
          </button>
          {!isLastPhase && (
            <button
              type="button"
              className="workflow-end-btn"
              onClick={handleEnd}
              aria-label="End"
              title="End"
            >
              <Square size={12} fill="currentColor" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default WorkflowControls;
