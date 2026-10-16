import { Activity, FileText, Layers, Link2, MoreVertical, RotateCcw, Scissors } from 'react-feather';
import HeaderMenu from './HeaderMenu';

const MenuItem = ({ icon: Icon, label, onSelect, close, danger }) => (
  <button
    role="menuitem"
    className={`header-menu-item${danger ? ' header-menu-item-danger' : ''}`}
    onClick={() => {
      close(false);
      onSelect();
    }}
  >
    <Icon size={15} aria-hidden="true" />
    <span>{label}</span>
  </button>
);

const BoardActionsMenu = ({
  onStartHealthCheck,
  onExportBoard,
  onStartNextBoard,
  onOpenLinkPrevious,
  onUnlinkSeries,
  inSeries,
  onResetVotes,
}) => (
  <HeaderMenu
    className="board-actions-menu"
    buttonClassName="btn icon-btn board-actions-btn"
    label="Board actions"
    buttonContent={<MoreVertical size={16} aria-hidden="true" />}
  >
    {(close) => (
      <>
        <MenuItem icon={Activity} label="Start health check" onSelect={onStartHealthCheck} close={close} />
        <MenuItem icon={FileText} label="Export board" onSelect={onExportBoard} close={close} />
        <div className="header-menu-separator" role="separator" />
        <MenuItem icon={Layers} label="Start next board" onSelect={onStartNextBoard} close={close} />
        <MenuItem icon={Link2} label="Link to previous board" onSelect={onOpenLinkPrevious} close={close} />
        {inSeries && (
          <MenuItem icon={Scissors} label="Remove from series" onSelect={onUnlinkSeries} close={close} />
        )}
        {onResetVotes && (
          <>
            <div className="header-menu-separator" role="separator" />
            <MenuItem icon={RotateCcw} label="Reset all votes" onSelect={onResetVotes} close={close} danger />
          </>
        )}
      </>
    )}
  </HeaderMenu>
);

export default BoardActionsMenu;
