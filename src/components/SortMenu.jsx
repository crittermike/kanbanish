import { Check, ChevronDown } from 'react-feather';
import HeaderMenu from './HeaderMenu';

const OPTIONS = [
  { byVotes: false, label: 'Newest' },
  { byVotes: true, label: 'Most votes' },
];

const SortMenu = ({ sortByVotes, setSortByVotes }) => {
  const current = sortByVotes ? 'Most votes' : 'Newest';

  return (
    <HeaderMenu
      className="sort-menu"
      buttonClassName="sort-menu-btn"
      label={`Sort cards: ${current}`}
      title="Sort cards"
      align="start"
      buttonContent={
        <>
          <span className="sort-menu-prefix">Sort:</span>
          <span>{current}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </>
      }
    >
      {(close) => OPTIONS.map(option => {
        const selected = !!sortByVotes === option.byVotes;
        return (
          <button
            key={option.label}
            role="menuitemradio"
            aria-checked={selected}
            className="header-menu-item"
            onClick={() => {
              setSortByVotes(option.byVotes);
              close();
            }}
          >
            <span>{option.label}</span>
            {selected && <Check size={14} aria-hidden="true" className="header-menu-check" />}
          </button>
        );
      })}
    </HeaderMenu>
  );
};

export default SortMenu;
