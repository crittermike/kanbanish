import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import SearchFilterBar from './SearchFilterBar';

describe('SearchFilterBar', () => {
  const defaultProps = {
    searchQuery: '',
    setSearchQuery: vi.fn(),
    isFiltering: false,
    matchingCount: 0,
    totalCards: 0,
    closeSearch: vi.fn(),
    searchInputRef: { current: null },
    isFilterPanelOpen: false,
    toggleFilterPanel: vi.fn(),
    filters: {
      tags: [],
      authorSelf: false,
      votesPreset: 'all',
      colors: [],
      hasComments: null,
      hasReactions: null,
      groupStatus: 'all',
    },
    hasActiveFilters: false,
    activeFilterCount: 0,
    toggleFilterValue: vi.fn(),
    setFilterValue: vi.fn(),
    clearFilters: vi.fn(),
    boardTags: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders search input with correct placeholder', () => {
      render(<SearchFilterBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search cards...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('aria-label', 'Search cards');
    });

    test('renders search icon', () => {
      const { container } = render(<SearchFilterBar {...defaultProps} />);
      const searchIcon = container.querySelector('.search-icon');
      expect(searchIcon).toBeInTheDocument();
      expect(searchIcon).toHaveAttribute('aria-hidden', 'true');
    });

    test('renders close button with correct aria-label', () => {
      render(<SearchFilterBar {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close search');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('title', 'Close search (Esc)');
    });
  });

  describe('Search Input Functionality', () => {
    test('calls setSearchQuery when user types in search input', () => {
      const setSearchQuery = vi.fn();
      render(<SearchFilterBar {...defaultProps} setSearchQuery={setSearchQuery} />);

      const input = screen.getByPlaceholderText('Search cards...');
      fireEvent.change(input, { target: { value: 'test query' } });

      expect(setSearchQuery).toHaveBeenCalledWith('test query');
    });

    test('displays search input value', () => {
      const { rerender } = render(
        <SearchFilterBar {...defaultProps} searchQuery="" />
      );
      const input = screen.getByPlaceholderText('Search cards...');
      expect(input).toHaveValue('');

      rerender(<SearchFilterBar {...defaultProps} searchQuery="test" />);
      expect(input).toHaveValue('test');
    });

    test('does not show clear button when searchQuery is empty', () => {
      render(<SearchFilterBar {...defaultProps} searchQuery="" />);
      const clearButton = screen.queryByLabelText('Clear search text');
      expect(clearButton).not.toBeInTheDocument();
    });

    test('shows clear button when searchQuery is not empty', () => {
      render(<SearchFilterBar {...defaultProps} searchQuery="test" />);
      const clearButton = screen.getByLabelText('Clear search text');
      expect(clearButton).toBeInTheDocument();
    });

    test('calls setSearchQuery with empty string when clear button is clicked', () => {
      const setSearchQuery = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          searchQuery="test"
          setSearchQuery={setSearchQuery}
        />
      );

      const clearButton = screen.getByLabelText('Clear search text');
      fireEvent.click(clearButton);

      expect(setSearchQuery).toHaveBeenCalledWith('');
    });
  });

  describe('Result Count Display', () => {
    test('does not show result count when isFiltering is false', () => {
      render(<SearchFilterBar {...defaultProps} isFiltering={false} />);
      expect(screen.queryByText(/of.*card/)).not.toBeInTheDocument();
    });

    test('shows result count when isFiltering is true', () => {
      render(
        <SearchFilterBar
          {...defaultProps}
          isFiltering={true}
          matchingCount={3}
          totalCards={10}
        />
      );
      expect(screen.getByText('3 of 10 cards')).toBeInTheDocument();
    });

    test('displays singular "card" when totalCards is 1', () => {
      render(
        <SearchFilterBar
          {...defaultProps}
          isFiltering={true}
          matchingCount={1}
          totalCards={1}
        />
      );
      expect(screen.getByText('1 of 1 card')).toBeInTheDocument();
    });

    test('displays plural "cards" when totalCards is greater than 1', () => {
      render(
        <SearchFilterBar
          {...defaultProps}
          isFiltering={true}
          matchingCount={2}
          totalCards={3}
        />
      );
      expect(screen.getByText('2 of 3 cards')).toBeInTheDocument();
    });

    test('result count has aria-live="polite" for accessibility', () => {
      render(
        <SearchFilterBar
          {...defaultProps}
          isFiltering={true}
          matchingCount={1}
          totalCards={5}
        />
      );
      const resultCount = screen.getByText('1 of 5 cards');
      expect(resultCount).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Close Search Button', () => {
    test('close button is always rendered', () => {
      render(<SearchFilterBar {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close search');
      expect(closeButton).toBeInTheDocument();
    });

    test('calls closeSearch when close button is clicked', () => {
      const closeSearch = vi.fn();
      render(<SearchFilterBar {...defaultProps} closeSearch={closeSearch} />);

      const button = screen.getByLabelText('Close search');
      fireEvent.click(button);

      expect(closeSearch).toHaveBeenCalledTimes(1);
    });

    test('close button has correct title attribute', () => {
      render(<SearchFilterBar {...defaultProps} />);
      const button = screen.getByLabelText('Close search');
      expect(button).toHaveAttribute('title', 'Close search (Esc)');
    });
  });

  describe('Ref Forwarding', () => {
    test('forwards ref to search input', () => {
      const ref = { current: null };
      render(<SearchFilterBar {...defaultProps} searchInputRef={ref} />);

      const input = screen.getByPlaceholderText('Search cards...');
      expect(ref.current).toBe(input);
    });

    test('handles ref with initial null value', () => {
      const ref = { current: null };
      render(<SearchFilterBar {...defaultProps} searchInputRef={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

  });
  describe('Filter Toggle Button', () => {
    test('renders filter toggle button', () => {
      render(<SearchFilterBar {...defaultProps} />);
      const btn = screen.getByLabelText('Toggle filters');
      expect(btn).toBeInTheDocument();
    });

    test('calls toggleFilterPanel when clicked', () => {
      const toggleFilterPanel = vi.fn();
      render(<SearchFilterBar {...defaultProps} toggleFilterPanel={toggleFilterPanel} />);
      fireEvent.click(screen.getByLabelText('Toggle filters'));
      expect(toggleFilterPanel).toHaveBeenCalledTimes(1);
    });

    test('shows badge when activeFilterCount > 0', () => {
      const { container } = render(
        <SearchFilterBar {...defaultProps} activeFilterCount={3} hasActiveFilters={true} />
      );
      const badge = container.querySelector('.filter-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
    });

    test('does not show badge when activeFilterCount is 0', () => {
      const { container } = render(
        <SearchFilterBar {...defaultProps} activeFilterCount={0} />
      );
      expect(container.querySelector('.filter-badge')).not.toBeInTheDocument();
    });

    test('has aria-expanded matching isFilterPanelOpen', () => {
      const { rerender } = render(
        <SearchFilterBar {...defaultProps} isFilterPanelOpen={false} />
      );
      expect(screen.getByLabelText('Toggle filters')).toHaveAttribute('aria-expanded', 'false');

      rerender(<SearchFilterBar {...defaultProps} isFilterPanelOpen={true} />);
      expect(screen.getByLabelText('Toggle filters')).toHaveAttribute('aria-expanded', 'true');
    });

    test('includes active count in aria-label', () => {
      render(
        <SearchFilterBar {...defaultProps} activeFilterCount={2} hasActiveFilters={true} />
      );
      expect(screen.getByLabelText('Toggle filters (2 active)')).toBeInTheDocument();
    });
  });

  describe('Filter Panel', () => {
    test('does not render filter panel when isFilterPanelOpen is false', () => {
      render(<SearchFilterBar {...defaultProps} isFilterPanelOpen={false} />);
      expect(screen.queryByRole('region', { name: 'Filter options' })).not.toBeInTheDocument();
    });

    test('renders filter panel when isFilterPanelOpen is true', () => {
      render(<SearchFilterBar {...defaultProps} isFilterPanelOpen={true} />);
      expect(screen.getByRole('region', { name: 'Filter options' })).toBeInTheDocument();
    });

    test('renders all non-tag filter sections', () => {
      render(<SearchFilterBar {...defaultProps} isFilterPanelOpen={true} />);
      expect(screen.getByText('Author')).toBeInTheDocument();
      expect(screen.getByText('Votes')).toBeInTheDocument();
      expect(screen.getByText('Color')).toBeInTheDocument();
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('Reactions')).toBeInTheDocument();
      expect(screen.getByText('Grouping')).toBeInTheDocument();
    });

    test('renders Tags section when boardTags are provided', () => {
      render(
        <SearchFilterBar
          {...defaultProps}
          isFilterPanelOpen={true}
          boardTags={['bug', 'feature', 'urgent']}
        />
      );
      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('bug')).toBeInTheDocument();
      expect(screen.getByText('feature')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    test('does not render Tags section when boardTags is empty', () => {
      render(
        <SearchFilterBar {...defaultProps} isFilterPanelOpen={true} boardTags={[]} />
      );
      expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    });

    test('renders 4 vote presets', () => {
      render(<SearchFilterBar {...defaultProps} isFilterPanelOpen={true} />);
      expect(screen.getAllByText('All')).toHaveLength(2);
      expect(screen.getByText('Has votes')).toBeInTheDocument();
      expect(screen.getByText('No votes')).toBeInTheDocument();
      expect(screen.getByText('Top')).toBeInTheDocument();
    });

    test('renders 8 color swatches', () => {
      render(<SearchFilterBar {...defaultProps} isFilterPanelOpen={true} />);
      expect(screen.getByLabelText('Filter by Red')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by Orange')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by Yellow')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by Green')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by Blue')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by Purple')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by Pink')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by Gray')).toBeInTheDocument();
    });

    test('renders My cards button for author filter', () => {
      render(<SearchFilterBar {...defaultProps} isFilterPanelOpen={true} />);
      expect(screen.getByText('My cards')).toBeInTheDocument();
    });

    test('calls setFilterValue when vote preset clicked', () => {
      const setFilterValue = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          isFilterPanelOpen={true}
          setFilterValue={setFilterValue}
        />
      );
      fireEvent.click(screen.getByText('Has votes'));
      expect(setFilterValue).toHaveBeenCalledWith('votesPreset', 'has-votes');
    });

    test('calls toggleFilterValue when color swatch clicked', () => {
      const toggleFilterValue = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          isFilterPanelOpen={true}
          toggleFilterValue={toggleFilterValue}
        />
      );
      fireEvent.click(screen.getByLabelText('Filter by Red'));
      expect(toggleFilterValue).toHaveBeenCalledWith('colors', '#f85149');
    });

    test('calls setFilterValue when My cards clicked', () => {
      const setFilterValue = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          isFilterPanelOpen={true}
          setFilterValue={setFilterValue}
        />
      );
      fireEvent.click(screen.getByText('My cards'));
      expect(setFilterValue).toHaveBeenCalledWith('authorSelf', true);
    });

    test('calls toggleFilterValue when tag clicked', () => {
      const toggleFilterValue = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          isFilterPanelOpen={true}
          boardTags={['bug']}
          toggleFilterValue={toggleFilterValue}
        />
      );
      fireEvent.click(screen.getByText('bug'));
      expect(toggleFilterValue).toHaveBeenCalledWith('tags', 'bug');
    });

    test('marks active vote preset with aria-pressed', () => {
      render(
        <SearchFilterBar
          {...defaultProps}
          isFilterPanelOpen={true}
          filters={{ ...defaultProps.filters, votesPreset: 'has-votes' }}
        />
      );
      expect(screen.getByText('Has votes')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getAllByText('All')[0]).toHaveAttribute('aria-pressed', 'false');
    });

    test('marks active color swatch with aria-pressed', () => {
      render(
        <SearchFilterBar
          {...defaultProps}
          isFilterPanelOpen={true}
          filters={{ ...defaultProps.filters, colors: ['#f85149'] }}
        />
      );
      expect(screen.getByLabelText('Filter by Red')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('Filter by Blue')).toHaveAttribute('aria-pressed', 'false');
    });

    test('calls setFilterValue for comment filter buttons', () => {
      const setFilterValue = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          isFilterPanelOpen={true}
          setFilterValue={setFilterValue}
        />
      );
      fireEvent.click(screen.getByText('Has comments'));
      expect(setFilterValue).toHaveBeenCalledWith('hasComments', true);
    });

    test('calls setFilterValue for reaction filter buttons', () => {
      const setFilterValue = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          isFilterPanelOpen={true}
          setFilterValue={setFilterValue}
        />
      );
      fireEvent.click(screen.getByText('Has reactions'));
      expect(setFilterValue).toHaveBeenCalledWith('hasReactions', true);
    });

    test('calls setFilterValue for grouping preset', () => {
      const setFilterValue = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          isFilterPanelOpen={true}
          setFilterValue={setFilterValue}
        />
      );
      fireEvent.click(screen.getByText('Grouped'));
      expect(setFilterValue).toHaveBeenCalledWith('groupStatus', 'grouped');
    });
  });

  describe('Filter Chips', () => {
    test('shows chips when hasActiveFilters is true', () => {
      render(
        <SearchFilterBar
          {...defaultProps}
          hasActiveFilters={true}
          filters={{ ...defaultProps.filters, votesPreset: 'has-votes' }}
        />
      );
      expect(screen.getByText('Has votes')).toBeInTheDocument();
    });

    test('shows Clear all button when filters are active', () => {
      render(
        <SearchFilterBar
          {...defaultProps}
          hasActiveFilters={true}
          filters={{ ...defaultProps.filters, votesPreset: 'has-votes' }}
        />
      );
      expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument();
    });

    test('calls clearFilters when Clear all is clicked', () => {
      const clearFilters = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          hasActiveFilters={true}
          filters={{ ...defaultProps.filters, votesPreset: 'has-votes' }}
          clearFilters={clearFilters}
        />
      );
      fireEvent.click(screen.getByLabelText('Clear all filters'));
      expect(clearFilters).toHaveBeenCalledTimes(1);
    });

    test('calls setFilterValue when vote chip is removed', () => {
      const setFilterValue = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          hasActiveFilters={true}
          filters={{ ...defaultProps.filters, votesPreset: 'has-votes' }}
          setFilterValue={setFilterValue}
        />
      );
      fireEvent.click(screen.getByLabelText('Remove filter: Has votes'));
      expect(setFilterValue).toHaveBeenCalledWith('votesPreset', 'all');
    });

    test('calls toggleFilterValue when color chip is removed', () => {
      const toggleFilterValue = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          hasActiveFilters={true}
          filters={{ ...defaultProps.filters, colors: ['#f85149'] }}
          toggleFilterValue={toggleFilterValue}
        />
      );
      fireEvent.click(screen.getByLabelText('Remove filter: Red'));
      expect(toggleFilterValue).toHaveBeenCalledWith('colors', '#f85149');
    });

    test('calls toggleFilterValue when tag chip is removed', () => {
      const toggleFilterValue = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          hasActiveFilters={true}
          filters={{ ...defaultProps.filters, tags: ['bug'] }}
          toggleFilterValue={toggleFilterValue}
        />
      );
      fireEvent.click(screen.getByLabelText('Remove filter: bug'));
      expect(toggleFilterValue).toHaveBeenCalledWith('tags', 'bug');
    });

    test('does not show chips when no filters are active', () => {
      const { container } = render(
        <SearchFilterBar {...defaultProps} hasActiveFilters={false} />
      );
      expect(container.querySelector('.filter-chips-row')).not.toBeInTheDocument();
    });

    test('shows My cards chip when authorSelf is true', () => {
      render(
        <SearchFilterBar
          {...defaultProps}
          hasActiveFilters={true}
          filters={{ ...defaultProps.filters, authorSelf: true }}
        />
      );
      expect(screen.getByText('My cards')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove filter: My cards')).toBeInTheDocument();
    });

    test('shows color dot in color chip', () => {
      const { container } = render(
        <SearchFilterBar
          {...defaultProps}
          hasActiveFilters={true}
          filters={{ ...defaultProps.filters, colors: ['#2ea043'] }}
        />
      );
      const dot = container.querySelector('.filter-chip-color-dot');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveStyle({ backgroundColor: '#2ea043' });
    });

    test('shows multiple chips for multiple active filters', () => {
      render(
        <SearchFilterBar
          {...defaultProps}
          hasActiveFilters={true}
          activeFilterCount={3}
          filters={{
            ...defaultProps.filters,
            votesPreset: 'top',
            authorSelf: true,
            hasComments: true,
          }}
        />
      );
      expect(screen.getByText('My cards')).toBeInTheDocument();
      expect(screen.getByText('Top')).toBeInTheDocument();
      expect(screen.getByText('Has comments')).toBeInTheDocument();
    });
  });
});
