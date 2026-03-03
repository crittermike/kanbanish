import { Search, X, Sliders, Tag, User, ThumbsUp, Droplet, MessageCircle, Smile, Layers } from 'react-feather';

/**
 * Card color palette — matches CardColorPicker.jsx CARD_COLORS.
 */
const CARD_COLORS = [
  { value: '#f85149', label: 'Red' },
  { value: '#db6d28', label: 'Orange' },
  { value: '#d29922', label: 'Yellow' },
  { value: '#2ea043', label: 'Green' },
  { value: '#58a6ff', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#f472b6', label: 'Pink' },
  { value: '#6b7280', label: 'Gray' },
];

/**
 * Vote preset options.
 */
const VOTE_PRESETS = [
  { value: 'all', label: 'All' },
  { value: 'has-votes', label: 'Has votes' },
  { value: 'no-votes', label: 'No votes' },
  { value: 'top', label: 'Top' },
];

/**
 * Group status options.
 */
const GROUP_PRESETS = [
  { value: 'all', label: 'All' },
  { value: 'grouped', label: 'Grouped' },
  { value: 'ungrouped', label: 'Ungrouped' },
];

/**
 * Builds a list of human-readable active filter chips for display.
 */
function getActiveFilterChips(filters) {
  const chips = [];

  for (const tag of filters.tags) {
    chips.push({ key: `tag-${tag}`, label: tag, icon: 'tag', filterKey: 'tags', value: tag });
  }

  if (filters.authorSelf) {
    chips.push({ key: 'author-self', label: 'My cards', icon: 'user', filterKey: 'authorSelf', value: false });
  }

  if (filters.votesPreset !== 'all') {
    const preset = VOTE_PRESETS.find(p => p.value === filters.votesPreset);
    chips.push({ key: 'votes', label: preset?.label || filters.votesPreset, icon: 'votes', filterKey: 'votesPreset', value: 'all' });
  }

  for (const color of filters.colors) {
    const colorInfo = CARD_COLORS.find(c => c.value === color);
    chips.push({ key: `color-${color}`, label: colorInfo?.label || color, icon: 'color', colorValue: color, filterKey: 'colors', value: color });
  }

  if (filters.hasComments !== null) {
    chips.push({
      key: 'comments',
      label: filters.hasComments ? 'Has comments' : 'No comments',
      icon: 'comments',
      filterKey: 'hasComments',
      value: null
    });
  }

  if (filters.hasReactions !== null) {
    chips.push({
      key: 'reactions',
      label: filters.hasReactions ? 'Has reactions' : 'No reactions',
      icon: 'reactions',
      filterKey: 'hasReactions',
      value: null
    });
  }

  if (filters.groupStatus !== 'all') {
    const preset = GROUP_PRESETS.find(p => p.value === filters.groupStatus);
    chips.push({ key: 'group', label: preset?.label || filters.groupStatus, icon: 'group', filterKey: 'groupStatus', value: 'all' });
  }

  return chips;
}


/**
 * SearchFilterBar — search input, structured filter panel, and result count.
 * Rendered below the board header when search is open.
 */
function SearchFilterBar({
  searchQuery,
  setSearchQuery,
  isFiltering,
  matchingCount,
  totalCards,
  closeSearch,
  searchInputRef,
  isFilterPanelOpen,
  toggleFilterPanel,
  filters,
  hasActiveFilters,
  activeFilterCount,
  toggleFilterValue,
  setFilterValue,
  clearFilters,
  boardTags
}) {
  const activeChips = getActiveFilterChips(filters);

  const handleRemoveChip = (chip) => {
    if (chip.filterKey === 'tags' || chip.filterKey === 'colors') {
      toggleFilterValue(chip.filterKey, chip.value);
    } else {
      setFilterValue(chip.filterKey, chip.value);
    }
  };

  return (
    <div className="search-filter-bar" role="search" aria-label="Search and filter cards">
      {/* Row 1: Search input + filter toggle + actions */}
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

        <button
          className={`filter-toggle-btn ${isFilterPanelOpen ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
          onClick={toggleFilterPanel}
          aria-expanded={isFilterPanelOpen}
          aria-controls="filter-panel"
          aria-label={`Toggle filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
          title="Toggle filters (Ctrl+Shift+F)"
        >
          <Sliders size={16} />
          {activeFilterCount > 0 && (
            <span className="filter-badge" aria-hidden="true">{activeFilterCount}</span>
          )}
        </button>

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

      {/* Row 2: Active filter chips (always visible when filters active) */}
      {hasActiveFilters && (
        <div className="filter-chips-row" aria-label="Active filters">
          {activeChips.map(chip => (
            <span key={chip.key} className="filter-chip">
              {chip.colorValue && (
                <span
                  className="filter-chip-color-dot"
                  style={{ backgroundColor: chip.colorValue }}
                  aria-hidden="true"
                />
              )}
              <span className="filter-chip-label">{chip.label}</span>
              <button
                className="filter-chip-remove"
                onClick={() => handleRemoveChip(chip)}
                aria-label={`Remove filter: ${chip.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            className="filter-clear-all-btn"
            onClick={clearFilters}
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Row 3: Collapsible filter panel */}
      {isFilterPanelOpen && (
        <div
          id="filter-panel"
          className="filter-panel"
          role="region"
          aria-label="Filter options"
        >
          {/* Tags */}
          {boardTags && boardTags.length > 0 && (
            <div className="filter-section">
              <div className="filter-section-label">
                <Tag size={13} aria-hidden="true" />
                <span>Tags</span>
              </div>
              <div className="filter-options filter-tags-list">
                {boardTags.map(tag => (
                  <button
                    key={tag}
                    className={`filter-tag-chip ${filters.tags.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleFilterValue('tags', tag)}
                    aria-pressed={filters.tags.includes(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Author */}
          <div className="filter-section">
            <div className="filter-section-label">
              <User size={13} aria-hidden="true" />
              <span>Author</span>
            </div>
            <div className="filter-options">
              <button
                className={`filter-preset-btn ${filters.authorSelf ? 'active' : ''}`}
                onClick={() => setFilterValue('authorSelf', !filters.authorSelf)}
                aria-pressed={filters.authorSelf}
              >
                My cards
              </button>
            </div>
          </div>

          {/* Votes */}
          <div className="filter-section">
            <div className="filter-section-label">
              <ThumbsUp size={13} aria-hidden="true" />
              <span>Votes</span>
            </div>
            <div className="filter-options">
              {VOTE_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  className={`filter-preset-btn ${filters.votesPreset === preset.value ? 'active' : ''}`}
                  onClick={() => setFilterValue('votesPreset', preset.value)}
                  aria-pressed={filters.votesPreset === preset.value}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="filter-section">
            <div className="filter-section-label">
              <Droplet size={13} aria-hidden="true" />
              <span>Color</span>
            </div>
            <div className="filter-options filter-color-list">
              {CARD_COLORS.map(color => (
                <button
                  key={color.value}
                  className={`filter-color-swatch ${filters.colors.includes(color.value) ? 'active' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => toggleFilterValue('colors', color.value)}
                  aria-pressed={filters.colors.includes(color.value)}
                  aria-label={`Filter by ${color.label}`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="filter-section">
            <div className="filter-section-label">
              <MessageCircle size={13} aria-hidden="true" />
              <span>Comments</span>
            </div>
            <div className="filter-options">
              <button
                className={`filter-preset-btn ${filters.hasComments === null ? 'active' : ''}`}
                onClick={() => setFilterValue('hasComments', null)}
                aria-pressed={filters.hasComments === null}
              >
                Any
              </button>
              <button
                className={`filter-preset-btn ${filters.hasComments === true ? 'active' : ''}`}
                onClick={() => setFilterValue('hasComments', true)}
                aria-pressed={filters.hasComments === true}
              >
                Has comments
              </button>
              <button
                className={`filter-preset-btn ${filters.hasComments === false ? 'active' : ''}`}
                onClick={() => setFilterValue('hasComments', false)}
                aria-pressed={filters.hasComments === false}
              >
                No comments
              </button>
            </div>
          </div>

          {/* Reactions */}
          <div className="filter-section">
            <div className="filter-section-label">
              <Smile size={13} aria-hidden="true" />
              <span>Reactions</span>
            </div>
            <div className="filter-options">
              <button
                className={`filter-preset-btn ${filters.hasReactions === null ? 'active' : ''}`}
                onClick={() => setFilterValue('hasReactions', null)}
                aria-pressed={filters.hasReactions === null}
              >
                Any
              </button>
              <button
                className={`filter-preset-btn ${filters.hasReactions === true ? 'active' : ''}`}
                onClick={() => setFilterValue('hasReactions', true)}
                aria-pressed={filters.hasReactions === true}
              >
                Has reactions
              </button>
              <button
                className={`filter-preset-btn ${filters.hasReactions === false ? 'active' : ''}`}
                onClick={() => setFilterValue('hasReactions', false)}
                aria-pressed={filters.hasReactions === false}
              >
                No reactions
              </button>
            </div>
          </div>

          {/* Group status */}
          <div className="filter-section">
            <div className="filter-section-label">
              <Layers size={13} aria-hidden="true" />
              <span>Grouping</span>
            </div>
            <div className="filter-options">
              {GROUP_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  className={`filter-preset-btn ${filters.groupStatus === preset.value ? 'active' : ''}`}
                  onClick={() => setFilterValue('groupStatus', preset.value)}
                  aria-pressed={filters.groupStatus === preset.value}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchFilterBar;
