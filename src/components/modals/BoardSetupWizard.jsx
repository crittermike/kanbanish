import { useState, useRef, useEffect } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import '../../styles/components/wizard.css';

export default function BoardSetupWizard({ isOpen, onClose, onConfirm, templateName, templateTags = [] }) {
  const [retrospectiveMode, setRetrospectiveMode] = useState(false);
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [showDisplayNames, setShowDisplayNames] = useState(false);
  const [actionItemsEnabled, setActionItemsEnabled] = useState(false);
  const [startHealthCheck, setStartHealthCheck] = useState(false);
  // Track latest tags in a ref so the effect only fires when isOpen changes
  const templateTagsRef = useRef(templateTags);
  templateTagsRef.current = templateTags;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const tags = templateTagsRef.current;
      const isRetroTemplate = tags.some(tag =>
        ['retrospective', 'reflection', 'agile', 'feedback', 'emotions'].includes(tag)
      );
      setRetrospectiveMode(isRetroTemplate);
      setVotingEnabled(true);
      setShowDisplayNames(false);
      setActionItemsEnabled(false);
      setStartHealthCheck(false);
    }
  }, [isOpen]);

  const modalRef = useRef(null);
  
  useFocusTrap(modalRef, isOpen, { onClose });

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      retrospectiveMode,
      votingEnabled,
      showDisplayNames,
      actionItemsEnabled,
      startHealthCheck,
    });
  };

  return (
    <div className="modal-overlay" role="presentation">
      <div ref={modalRef} className="modal-container wizard-modal" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
        <div className="modal-header">
          <div>
            <h2 id="wizard-title">Set Up Your Board</h2>
            {templateName && (
              <p className="wizard-template-name">Template: {templateName}</p>
            )}
          </div>
          <button 
            className="close-button" 
            onClick={onClose} 
            aria-label="Close setup wizard"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="wizard-section">
            <h3 className="wizard-section-title">Board Mode</h3>
            <div className="settings-boolean-option" role="radiogroup" aria-label="Board Mode">
              <button 
                className={`boolean-option ${!retrospectiveMode ? 'selected' : ''}`} 
                onClick={() => setRetrospectiveMode(false)}
                role="radio"
                aria-checked={!retrospectiveMode}
              >
                📋 Kanban Mode
              </button>
              <button 
                className={`boolean-option ${retrospectiveMode ? 'selected' : ''}`} 
                onClick={() => { setRetrospectiveMode(true); setVotingEnabled(true); }}
                role="radio"
                aria-checked={retrospectiveMode}
              >
                🔄 Retrospective Mode
              </button>
            </div>
            <p className="settings-hint">
              {retrospectiveMode 
                ? "Guided workflow with structured phases for team reflection."
                : "Free-form board for managing tasks and ideas."}
            </p>
          </div>

          <div className="settings-divider"></div>

          <div className="wizard-section">
            <h3 className="wizard-section-title">Features</h3>
            
            <div className="wizard-setting-group">
              <div className="settings-toggle-row">
                <span className="settings-toggle-label" id="label-voting">Allow Voting</span>
                <button 
                  className={`settings-toggle-switch${retrospectiveMode ? ' settings-toggle-disabled' : ''}`}
                  role="switch" 
                  aria-checked={votingEnabled} 
                  onClick={() => { if (!retrospectiveMode) setVotingEnabled(!votingEnabled); }}
                  aria-labelledby="label-voting"
                  aria-disabled={retrospectiveMode}
                >
                  <span className="settings-toggle-knob"></span>
                </button>
              </div>
              <p className="settings-hint">
                {retrospectiveMode
                  ? 'Voting is always enabled in retrospective mode'
                  : 'Let participants upvote and downvote cards'}
              </p>
            </div>

            <div className="wizard-setting-group">
              <div className="settings-toggle-row">
                <span className="settings-toggle-label" id="label-names">Show Display Names</span>
                <button 
                  className="settings-toggle-switch" 
                  role="switch" 
                  aria-checked={showDisplayNames} 
                  onClick={() => setShowDisplayNames(!showDisplayNames)} 
                  aria-labelledby="label-names"
                >
                  <span className="settings-toggle-knob"></span>
                </button>
              </div>
              <p className="settings-hint">Show author names and avatars on cards and comments</p>
            </div>

            <div className="wizard-setting-group">
              <div className="settings-toggle-row">
                <span className="settings-toggle-label" id="label-action-items">Enable Action Items</span>
                <button 
                  className="settings-toggle-switch" 
                  role="switch" 
                  aria-checked={actionItemsEnabled} 
                  onClick={() => setActionItemsEnabled(!actionItemsEnabled)} 
                  aria-labelledby="label-action-items"
                >
                  <span className="settings-toggle-knob"></span>
                </button>
              </div>
              <p className="settings-hint">Track action items with assignees and due dates</p>
            </div>
            
            <div className="wizard-setting-group">
              <div className="settings-toggle-row">
                <span className="settings-toggle-label" id="label-health-check">Start with Health Check</span>
                <button 
                  className="settings-toggle-switch" 
                  role="switch" 
                  aria-checked={startHealthCheck} 
                  onClick={() => setStartHealthCheck(!startHealthCheck)} 
                  aria-labelledby="label-health-check"
                >
                  <span className="settings-toggle-knob"></span>
                </button>
              </div>
              <p className="settings-hint">Begin with a team health check survey</p>
            </div>
            
          </div>
        </div>

        <div className="modal-footer">
          <button className="primary-button" onClick={handleConfirm}>
            Create Board
          </button>
          <button className="secondary-button" onClick={onClose}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
