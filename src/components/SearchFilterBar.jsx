import { Filter, Search, X } from 'react-feather';

/**
 * SearchFilterBar — search input, filter controls, and result count.
 * Rendered below the board header when search is open.
 */
function SearchFilterBar({
  searchQuery,
  setSearchQuery,
  minVotes,
  setMinVotes,
  filterColumn,
  setFilterColumn,
  myCardsOnly,
  setMyCardsOnly,
  groupedFilter,
  setGroupedFilter,
  isFiltering,
  matchingCount,
  totalCards,
  columnOptions,
  clearFilters,
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

      <div className="search-filters-row">
        <Filter size={14} className="filter-icon" aria-hidden="true" />

        {/* Min votes filter */}
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-min-votes">
            Min votes
          </label>
          <input
            id="filter-min-votes"
            type="number"
            className="filter-number-input"
            min="0"
            value={minVotes || ''}
            placeholder="0"
            onChange={e => setMinVotes(Math.max(0, parseInt(e.target.value, 10) || 0))}
          />
        </div>

        {/* Column filter */}
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-column">
            Column
          </label>
          <select
            id="filter-column"
            className="filter-select"
            value={filterColumn}
            onChange={e => setFilterColumn(e.target.value)}
          >
            <option value="">All columns</option>
            {columnOptions.map(col => (
              <option key={col.id} value={col.id}>{col.title}</option>
            ))}
          </select>
        </div>

        {/* My cards filter */}
        <button
          className={`filter-pill ${myCardsOnly ? 'active' : ''}`}
          onClick={() => setMyCardsOnly(!myCardsOnly)}
          aria-pressed={myCardsOnly}
        >
          My cards
        </button>

        {/* Grouped filter */}
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-grouped">
            Show
          </label>
          <select
            id="filter-grouped"
            className="filter-select"
            value={groupedFilter}
            onChange={e => setGroupedFilter(e.target.value)}
          >
            <option value="all">All cards</option>
            <option value="grouped">Grouped only</option>
            <option value="ungrouped">Ungrouped only</option>
          </select>
        </div>

        {/* Clear all */}
        {isFiltering && (
          <button
            className="filter-clear-btn"
            onClick={clearFilters}
            aria-label="Clear all filters"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchFilterBar;
