import { Activity, Check, FileText, Layers, Link2, Moon, MoreVertical, RotateCcw, Scissors, Share2 } from 'react-feather';
import HeaderMenu from './HeaderMenu';

const SORT_OPTIONS = [
  { byVotes: false, label: 'Newest' },
  { byVotes: true, label: 'Most votes' },
];

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

const Separator = () => <div className="header-menu-separator" role="separator" />;

/**
 * Header ⋮ menu: view options (sort, theme) and one-off board actions.
 */
const BoardActionsMenu = ({
  showSort,
  sortByVotes,
  onSortChange,
  onShare,
  onStartHealthCheck,
  onExportBoard,
  onStartNextBoard,
  onOpenLinkPrevious,
  onUnlinkSeries,
  inSeries,
  darkMode,
  onToggleDarkMode,
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
        {showSort && (
          <>
            <div role="group" aria-labelledby="board-actions-sort-label">
              <div id="board-actions-sort-label" className="header-menu-label">Sort by</div>
              {SORT_OPTIONS.map(option => {
                const selected = !!sortByVotes === option.byVotes;
                return (
                  <button
                    key={option.label}
                    role="menuitemradio"
                    aria-checked={selected}
                    className="header-menu-item"
                    onClick={() => {
                      close(false);
                      if (!selected) onSortChange(option.byVotes);
                    }}
                  >
                    {selected
                      ? <Check size={15} aria-hidden="true" />
                      : <span className="header-menu-icon-spacer" aria-hidden="true" />}
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
            <Separator />
          </>
        )}
        <MenuItem icon={Share2} label="Copy board link" onSelect={onShare} close={close} />
        <MenuItem icon={FileText} label="Export board" onSelect={onExportBoard} close={close} />
        {onStartHealthCheck && (
          <MenuItem icon={Activity} label="Start health check" onSelect={onStartHealthCheck} close={close} />
        )}
        <Separator />
        <MenuItem icon={Layers} label="Start next board" onSelect={onStartNextBoard} close={close} />
        <MenuItem icon={Link2} label="Link to previous board" onSelect={onOpenLinkPrevious} close={close} />
        {inSeries && (
          <MenuItem icon={Scissors} label="Remove from series" onSelect={onUnlinkSeries} close={close} />
        )}
        <Separator />
        {/* Stays open so the theme change is visible */}
        <button
          role="menuitemcheckbox"
          aria-checked={!!darkMode}
          className="header-menu-item header-menu-item-switch"
          onClick={() => onToggleDarkMode(!darkMode)}
        >
          <Moon size={15} aria-hidden="true" />
          <span>Dark mode</span>
          <span className="header-menu-switch" aria-hidden="true" />
        </button>
        {onResetVotes && (
          <>
            <Separator />
            <MenuItem icon={RotateCcw} label="Reset all votes" onSelect={onResetVotes} close={close} danger />
          </>
        )}
      </>
    )}
  </HeaderMenu>
);

export default BoardActionsMenu;
