import React from 'react';
import { useBoardContext } from '../context/BoardContext';
import { Eye, Users, MessageCircle, Award, ArrowLeft, BarChart } from 'react-feather';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';

const WorkflowControls = ({ showNotification }) => {
  const {
    workflowPhase,
    retrospectiveMode,
    startGroupingPhase,
    startInteractionsPhase,
    startInteractionRevealPhase,
    startResultsPhase,
    startPollPhase,
    startPollResultsPhase,
    goToPreviousPhase
  } = useBoardContext();

  const handleStartGrouping = () => {
    startGroupingPhase();
    showNotification('Grouping phase started - cards revealed, grouping enabled');
  };

  const handleStartInteractions = () => {
    startInteractionsPhase();
    showNotification('Interactions phase started - add comments, votes, and reactions');
  };

  const handleRevealInteractions = () => {
    startInteractionRevealPhase();
    showNotification('Interactions revealed!');
  };

  const handleStartResults = () => {
    startResultsPhase();
    showNotification('Results phase started - view top items by votes');
  };

  const handleStartPoll = () => {
    startPollPhase();
    showNotification('Poll phase started - rate the effectiveness of this retrospective');
  };

  const handleStartPollResults = () => {
    startPollResultsPhase();
    showNotification('Poll results revealed - view effectiveness ratings');
  };

  const handleGoToPreviousPhase = () => {
    const phaseMessages = {
      [WORKFLOW_PHASES.GROUPING]: 'Returned to creation phase',
      [WORKFLOW_PHASES.INTERACTIONS]: 'Returned to grouping phase',
      [WORKFLOW_PHASES.INTERACTION_REVEAL]: 'Returned to interactions phase',
      [WORKFLOW_PHASES.RESULTS]: 'Returned to interaction reveal phase',
      [WORKFLOW_PHASES.POLL]: 'Returned to results phase',
      [WORKFLOW_PHASES.POLL_RESULTS]: 'Returned to poll phase'
    };

    goToPreviousPhase();
    const message = phaseMessages[workflowPhase] || 'Moved to previous phase';
    showNotification(message);
  };

  const renderPhaseControls = () => {
    switch (workflowPhase) {
      case WORKFLOW_PHASES.CREATION:
        return (
          <div className="workflow-phase">
            <div className="phase-info">
              <h3>Card Creation Phase</h3>
              <p>Add cards to the board. When ready, reveal cards and start grouping.</p>
            </div>
            <div className="phase-controls">
              <button 
                className="btn primary-btn"
                onClick={handleStartGrouping}
              >
                <Eye size={16} />
                Reveal Cards & Start Grouping
              </button>
            </div>
          </div>
        );

      case WORKFLOW_PHASES.GROUPING:
        return (
          <div className="workflow-phase">
            <div className="phase-info">
              <h3>Grouping Phase</h3>
              <p>Cards are revealed. Group related cards together by dragging them onto each other.</p>
            </div>
            <div className="phase-controls">
              <button 
                className="btn primary-btn"
                onClick={handleStartInteractions}
              >
                <MessageCircle size={16} />
                Start Voting
              </button>
              <button 
                className="btn secondary-btn"
                onClick={handleGoToPreviousPhase}
              >
                <ArrowLeft size={16} />
                Go to Previous Phase
              </button>
            </div>
          </div>
        );

      case WORKFLOW_PHASES.INTERACTIONS:
        return (
          <div className="workflow-phase">
            <div className="phase-info">
              <h3>Voting Phase</h3>
              <p>Add comments, votes, and reactions to cards and groups. Activity is hidden from other users.</p>
            </div>
            <div className="phase-controls">
              <button 
                className="btn primary-btn"
                onClick={handleRevealInteractions}
              >
                <Eye size={16} />
                Reveal Votes
              </button>
              <button 
                className="btn secondary-btn"
                onClick={handleGoToPreviousPhase}
              >
                <ArrowLeft size={16} />
                Go to Previous Phase
              </button>
            </div>
          </div>
        );

      case WORKFLOW_PHASES.INTERACTION_REVEAL:
        return (
          <div className="workflow-phase">
            <div className="phase-info">
              <h3>Voting Results Phase</h3>
              <p>All votes are now visible. Review the feedback and votes.</p>
            </div>
            <div className="phase-controls">
              <button 
                className="btn primary-btn"
                onClick={handleStartResults}
              >
                <Award size={16} />
                View Results
              </button>
              <button 
                className="btn secondary-btn"
                onClick={handleGoToPreviousPhase}
              >
                <ArrowLeft size={16} />
                Go to Previous Phase
              </button>
            </div>
          </div>
        );

      case WORKFLOW_PHASES.RESULTS:
        return (
          <div className="workflow-phase">
            <div className="phase-info">
              <h3>Results Phase</h3>
              <p>Viewing the top-voted cards and groups. Use navigation to browse all results.</p>
            </div>
            <div className="phase-controls">
              <button 
                className="btn primary-btn"
                onClick={handleStartPoll}
              >
                <BarChart size={16} />
                Start Effectiveness Poll
              </button>
              <button 
                className="btn secondary-btn"
                onClick={handleGoToPreviousPhase}
              >
                <ArrowLeft size={16} />
                Go to Previous Phase
              </button>
            </div>
          </div>
        );

      case WORKFLOW_PHASES.POLL:
        return (
          <div className="workflow-phase">
            <div className="phase-info">
              <h3>Effectiveness Poll</h3>
              <p>Rate the effectiveness of this retrospective on a scale of 1-5. Your vote is private.</p>
            </div>
            <div className="phase-controls">
              <button 
                className="btn primary-btn"
                onClick={handleStartPollResults}
              >
                <BarChart size={16} />
                View Poll Results
              </button>
              <button 
                className="btn secondary-btn"
                onClick={handleGoToPreviousPhase}
              >
                <ArrowLeft size={16} />
                Go to Previous Phase
              </button>
            </div>
          </div>
        );

      case WORKFLOW_PHASES.POLL_RESULTS:
        return (
          <div className="workflow-phase">
            <div className="phase-info">
              <h3>Poll Results</h3>
              <p>View the distribution of effectiveness ratings and overall retrospective score.</p>
            </div>
            <div className="phase-controls">
              <button 
                className="btn secondary-btn"
                onClick={handleGoToPreviousPhase}
              >
                <ArrowLeft size={16} />
                Go to Previous Phase
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="workflow-controls">
      {renderPhaseControls()}
    </div>
  );
};

export default WorkflowControls;
