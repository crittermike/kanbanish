import { useState } from 'react';
import { Play } from 'react-feather';
import StartStepsModal from './modals/StartStepsModal';

const LABEL = 'Start: add, group, vote, discuss';

/** Header ▶ button: opens the dialog that starts the Add → Group → Vote → Discuss steps. */
const FlowStartButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flow-start">
      <button
        type="button"
        className="btn icon-btn flow-start-btn"
        onClick={() => setOpen(true)}
        aria-label={LABEL}
        aria-haspopup="dialog"
        title={LABEL}
      >
        <Play size={15} aria-hidden="true" />
      </button>
      <StartStepsModal isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default FlowStartButton;
