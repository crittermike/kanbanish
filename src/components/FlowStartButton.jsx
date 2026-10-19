import { Activity, BarChart2, ChevronDown, Play } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';
import HeaderMenu from './HeaderMenu';

const OptionItem = ({ icon: Icon, label, checked, onChange }) => (
  // Stays open so both options can be set before starting
  <button
    role="menuitemcheckbox"
    aria-checked={checked}
    className="header-menu-item header-menu-item-switch"
    onClick={() => onChange(!checked)}
  >
    <Icon size={15} aria-hidden="true" />
    <span>{label}</span>
    <span className="header-menu-switch" aria-hidden="true" />
  </button>
);

/**
 * Header ▶ split button: starts the Add → Group → Vote → Discuss steps.
 * The caret sets the optional first (health check) and last (poll) steps,
 * which are remembered on the board so repeat starts are one click.
 */
const FlowStartButton = () => {
  const { startFlow, flowHealthCheck, flowPoll, updateFlowHealthCheck, updateFlowPoll } = useBoardContext();

  const steps = [
    flowHealthCheck && 'health check',
    'add', 'group', 'vote', 'discuss',
    flowPoll && 'poll'
  ].filter(Boolean).join(', ');
  const label = `Start: ${steps}`;

  return (
    <div className="flow-start">
      <button
        type="button"
        className="btn icon-btn flow-start-btn"
        onClick={startFlow}
        aria-label={label}
        title={label}
      >
        <Play size={15} aria-hidden="true" />
      </button>
      <HeaderMenu
        className="flow-start-options"
        buttonClassName="btn icon-btn flow-start-options-btn"
        label="Step options"
        buttonContent={<ChevronDown size={14} aria-hidden="true" />}
      >
        {() => (
          <>
            <OptionItem icon={Activity} label="Health check" checked={!!flowHealthCheck} onChange={updateFlowHealthCheck} />
            <OptionItem icon={BarChart2} label="Poll" checked={!!flowPoll} onChange={updateFlowPoll} />
          </>
        )}
      </HeaderMenu>
    </div>
  );
};

export default FlowStartButton;
