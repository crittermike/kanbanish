import { useState } from 'react';
import '../../styles/components/modals.css';

const VoteLimitModal = ({ isOpen, onClose, onConfirm, currentLimit = 3 }) => {
  const [votesPerUser, setVotesPerUser] = useState(currentLimit);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(votesPerUser);
    onClose();
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 20) {
      setVotesPerUser(value);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Set Vote Limit</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="vote-limit-content">
            <p className="vote-limit-description">
              How many votes should each user be allowed to cast during the voting phase?
            </p>
            
            <div className="vote-limit-input-section">
              <label htmlFor="votes-per-user">Votes per user:</label>
              <div className="vote-limit-input-container">
                <input
                  id="votes-per-user"
                  type="number"
                  min="1"
                  max="20"
                  value={votesPerUser}
                  onChange={handleInputChange}
                  className="vote-limit-input"
                />
                <span className="vote-limit-input-suffix">votes</span>
              </div>
            </div>
            
            <div className="vote-limit-examples">
              <p className="vote-limit-examples-title">Common settings:</p>
              <div className="vote-limit-preset-buttons">
                {[1, 3, 5, 10].map(preset => (
                  <button
                    key={preset}
                    className={`vote-limit-preset ${votesPerUser === preset ? 'active' : ''}`}
                    onClick={() => setVotesPerUser(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="vote-limit-info">
              <p>
                This setting controls the maximum number of votes each participant can cast across all cards and groups. 
                Users will see their remaining vote count as they vote.
              </p>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="primary-button" onClick={handleConfirm}>
            Start Voting Phase
          </button>
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoteLimitModal;
