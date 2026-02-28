import { Search, X } from 'react-feather';

/**
 * SearchFilterBar — search input and result count.
 * Rendered below the board header when search is open.
 */
function SearchFilterBar({
  searchQuery,
  setSearchQuery,
  isFiltering,
  matchingCount,
  totalCards,
  closeSearch,
  searchInputRef
}) {
  return (
    <div className="search-filter-bar">
      <div className="search-input-row">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search cards"
          />
          {searchQuery && (
            <button
              className="search-clear-input"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search text"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="search-actions">
          {isFiltering && (
            <span className="search-result-count" aria-live="polite">
              {matchingCount} of {totalCards} card{totalCards !== 1 ? 's' : ''}
            </span>
          )}
          <button
            className="search-close-btn"
            onClick={closeSearch}
            aria-label="Close search"
            title="Close search (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchFilterBar;
