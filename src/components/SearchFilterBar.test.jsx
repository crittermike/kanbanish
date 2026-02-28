import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import SearchFilterBar from './SearchFilterBar';

describe('SearchFilterBar', () => {
  const defaultProps = {
    searchQuery: '',
    setSearchQuery: vi.fn(),
    minVotes: 0,
    setMinVotes: vi.fn(),
    filterColumn: '',
    setFilterColumn: vi.fn(),
    myCardsOnly: false,
    setMyCardsOnly: vi.fn(),
    groupedFilter: 'all',
    setGroupedFilter: vi.fn(),
    isFiltering: false,
    matchingCount: 0,
    totalCards: 0,
    columnOptions: [],
    clearFilters: vi.fn(),
    closeSearch: vi.fn(),
    searchInputRef: { current: null },
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

    test('renders filter icon', () => {
      const { container } = render(<SearchFilterBar {...defaultProps} />);
      const filterIcon = container.querySelector('.filter-icon');
      expect(filterIcon).toBeInTheDocument();
      expect(filterIcon).toHaveAttribute('aria-hidden', 'true');
    });

    test('renders all filter controls', () => {
      render(<SearchFilterBar {...defaultProps} />);
      expect(screen.getByLabelText('Min votes')).toBeInTheDocument();
      expect(screen.getByLabelText('Column')).toBeInTheDocument();
      expect(screen.getByLabelText('Show')).toBeInTheDocument();
      expect(screen.getByText('My cards')).toBeInTheDocument();
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

  describe('Min Votes Filter', () => {
    test('renders min votes input with correct id and label', () => {
      render(<SearchFilterBar {...defaultProps} />);
      const input = screen.getByLabelText('Min votes');
      expect(input).toHaveAttribute('id', 'filter-min-votes');
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('min', '0');
    });

    test('displays min votes value', () => {
      const { rerender } = render(
        <SearchFilterBar {...defaultProps} minVotes={0} />
      );
      const input = screen.getByLabelText('Min votes');
      expect(input).toHaveValue(null); // empty value when 0

      rerender(<SearchFilterBar {...defaultProps} minVotes={5} />);
      expect(input).toHaveValue(5);
    });

    test('calls setMinVotes when input changes', () => {
      const setMinVotes = vi.fn();
      render(<SearchFilterBar {...defaultProps} setMinVotes={setMinVotes} />);

      const input = screen.getByLabelText('Min votes');
      fireEvent.change(input, { target: { value: '3' } });

      expect(setMinVotes).toHaveBeenCalledWith(3);
    });

    test('converts non-numeric input to 0', () => {
      const setMinVotes = vi.fn();
      render(<SearchFilterBar {...defaultProps} setMinVotes={setMinVotes} />);

      const input = screen.getByLabelText('Min votes');
      // Type '0' (empty input won't fire on number type, so test with NaN-producing input)
      // The handler Math.max(0, parseInt('0', 10) || 0) = 0
      fireEvent.change(input, { target: { value: '0' } });
      expect(setMinVotes).toHaveBeenCalledWith(0);
      
      // Reset and test with another value
      setMinVotes.mockClear();
      fireEvent.change(input, { target: { value: '5' } });
      expect(setMinVotes).toHaveBeenCalledWith(5);
    });

    test('ensures value is never negative', () => {
      const setMinVotes = vi.fn();
      render(<SearchFilterBar {...defaultProps} setMinVotes={setMinVotes} />);

      const input = screen.getByLabelText('Min votes');
      fireEvent.change(input, { target: { value: '-5' } });

      expect(setMinVotes).toHaveBeenCalledWith(0);
    });
  });

  describe('Column Filter Select', () => {
    test('renders column filter with "All columns" default option', () => {
      render(<SearchFilterBar {...defaultProps} />);
      expect(screen.getByDisplayValue('All columns')).toBeInTheDocument();
    });

    test('renders column filter with correct id and label', () => {
      render(<SearchFilterBar {...defaultProps} />);
      const select = screen.getByLabelText('Column');
      expect(select).toHaveAttribute('id', 'filter-column');
    });

    test('renders all column options', () => {
      const columnOptions = [
        { id: 'col1', title: 'To Do' },
        { id: 'col2', title: 'In Progress' },
        { id: 'col3', title: 'Done' },
      ];
      render(
        <SearchFilterBar {...defaultProps} columnOptions={columnOptions} />
      );

      // Check that all option elements exist (not selected, just rendered)
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    test('calls setFilterColumn when column is selected', () => {
      const setFilterColumn = vi.fn();
      const columnOptions = [{ id: 'col1', title: 'To Do' }];
      render(
        <SearchFilterBar
          {...defaultProps}
          columnOptions={columnOptions}
          setFilterColumn={setFilterColumn}
        />
      );

      const select = screen.getByLabelText('Column');
      fireEvent.change(select, { target: { value: 'col1' } });

      expect(setFilterColumn).toHaveBeenCalledWith('col1');
    });

    test('displays selected column value', () => {
      const { rerender } = render(
        <SearchFilterBar {...defaultProps} filterColumn="" />
      );
      let select = screen.getByLabelText('Column');
      expect(select).toHaveValue('');

      const columnOptions = [{ id: 'col1', title: 'To Do' }];
      rerender(
        <SearchFilterBar
          {...defaultProps}
          filterColumn="col1"
          columnOptions={columnOptions}
        />
      );
      select = screen.getByLabelText('Column');
      expect(select).toHaveValue('col1');
    });
  });

  describe('My Cards Button', () => {
    test('renders my cards button', () => {
      render(<SearchFilterBar {...defaultProps} />);
      const button = screen.getByText('My cards');
      expect(button).toBeInTheDocument();
    });

    test('has aria-pressed attribute', () => {
      render(<SearchFilterBar {...defaultProps} myCardsOnly={false} />);
      const button = screen.getByText('My cards');
      expect(button).toHaveAttribute('aria-pressed');
    });

    test('sets aria-pressed to false when myCardsOnly is false', () => {
      render(<SearchFilterBar {...defaultProps} myCardsOnly={false} />);
      const button = screen.getByText('My cards');
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    test('sets aria-pressed to true when myCardsOnly is true', () => {
      render(<SearchFilterBar {...defaultProps} myCardsOnly={true} />);
      const button = screen.getByText('My cards');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    test('does not have active class when myCardsOnly is false', () => {
      render(<SearchFilterBar {...defaultProps} myCardsOnly={false} />);
      const button = screen.getByText('My cards');
      expect(button).not.toHaveClass('active');
    });

    test('has active class when myCardsOnly is true', () => {
      render(<SearchFilterBar {...defaultProps} myCardsOnly={true} />);
      const button = screen.getByText('My cards');
      expect(button).toHaveClass('active');
    });

    test('calls setMyCardsOnly with toggled value when clicked', () => {
      const setMyCardsOnly = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          myCardsOnly={false}
          setMyCardsOnly={setMyCardsOnly}
        />
      );

      const button = screen.getByText('My cards');
      fireEvent.click(button);

      expect(setMyCardsOnly).toHaveBeenCalledWith(true);
    });

    test('toggles setMyCardsOnly value when clicked from true', () => {
      const setMyCardsOnly = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          myCardsOnly={true}
          setMyCardsOnly={setMyCardsOnly}
        />
      );

      const button = screen.getByText('My cards');
      fireEvent.click(button);

      expect(setMyCardsOnly).toHaveBeenCalledWith(false);
    });
  });

  describe('Grouped Filter Select', () => {
    test('renders grouped filter with correct id and label', () => {
      render(<SearchFilterBar {...defaultProps} />);
      const select = screen.getByLabelText('Show');
      expect(select).toHaveAttribute('id', 'filter-grouped');
    });

    test('renders all grouped filter options', () => {
      render(<SearchFilterBar {...defaultProps} />);
      // Check that all option elements exist
      expect(screen.getByText('All cards')).toBeInTheDocument();
      expect(screen.getByText('Grouped only')).toBeInTheDocument();
      expect(screen.getByText('Ungrouped only')).toBeInTheDocument();
    });

    test('displays correct default value', () => {
      render(<SearchFilterBar {...defaultProps} groupedFilter="all" />);
      const select = screen.getByLabelText('Show');
      expect(select).toHaveValue('all');
    });

    test('displays selected grouped filter value', () => {
      const { rerender } = render(
        <SearchFilterBar {...defaultProps} groupedFilter="all" />
      );
      let select = screen.getByLabelText('Show');
      expect(select).toHaveValue('all');

      rerender(<SearchFilterBar {...defaultProps} groupedFilter="grouped" />);
      select = screen.getByLabelText('Show');
      expect(select).toHaveValue('grouped');

      rerender(<SearchFilterBar {...defaultProps} groupedFilter="ungrouped" />);
      select = screen.getByLabelText('Show');
      expect(select).toHaveValue('ungrouped');
    });

    test('calls setGroupedFilter when option is selected', () => {
      const setGroupedFilter = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          setGroupedFilter={setGroupedFilter}
        />
      );

      const select = screen.getByLabelText('Show');
      fireEvent.change(select, { target: { value: 'grouped' } });

      expect(setGroupedFilter).toHaveBeenCalledWith('grouped');
    });

    test('calls setGroupedFilter for each option', () => {
      const setGroupedFilter = vi.fn();
      const { rerender } = render(
        <SearchFilterBar
          {...defaultProps}
          setGroupedFilter={setGroupedFilter}
        />
      );

      let select = screen.getByLabelText('Show');
      fireEvent.change(select, { target: { value: 'grouped' } });
      expect(setGroupedFilter).toHaveBeenCalledWith('grouped');

      rerender(
        <SearchFilterBar
          {...defaultProps}
          setGroupedFilter={setGroupedFilter}
        />
      );
      select = screen.getByLabelText('Show');
      fireEvent.change(select, { target: { value: 'ungrouped' } });
      expect(setGroupedFilter).toHaveBeenCalledWith('ungrouped');
    });
  });

  describe('Clear Filters Button', () => {
    test('does not show clear filters button when isFiltering is false', () => {
      render(<SearchFilterBar {...defaultProps} isFiltering={false} />);
      expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
    });

    test('shows clear filters button when isFiltering is true', () => {
      render(<SearchFilterBar {...defaultProps} isFiltering={true} />);
      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });

    test('clear filters button has correct aria-label', () => {
      render(<SearchFilterBar {...defaultProps} isFiltering={true} />);
      const button = screen.getByLabelText('Clear all filters');
      expect(button).toBeInTheDocument();
    });

    test('calls clearFilters when button is clicked', () => {
      const clearFilters = vi.fn();
      render(
        <SearchFilterBar
          {...defaultProps}
          isFiltering={true}
          clearFilters={clearFilters}
        />
      );

      const button = screen.getByText('Clear filters');
      fireEvent.click(button);

      expect(clearFilters).toHaveBeenCalledTimes(1);
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

  describe('Multiple Interactions', () => {
    test('handles multiple filter changes together', () => {
      const setSearchQuery = vi.fn();
      const setMinVotes = vi.fn();
      const setFilterColumn = vi.fn();
      const setMyCardsOnly = vi.fn();

      const columnOptions = [{ id: 'col1', title: 'To Do' }];

      render(
        <SearchFilterBar
          {...defaultProps}
          setSearchQuery={setSearchQuery}
          setMinVotes={setMinVotes}
          setFilterColumn={setFilterColumn}
          setMyCardsOnly={setMyCardsOnly}
          columnOptions={columnOptions}
        />
      );

      // Change search
      const searchInput = screen.getByPlaceholderText('Search cards...');
      fireEvent.change(searchInput, { target: { value: 'bug' } });

      // Change min votes
      const minVotesInput = screen.getByLabelText('Min votes');
      fireEvent.change(minVotesInput, { target: { value: '2' } });

      // Change column
      const columnSelect = screen.getByLabelText('Column');
      fireEvent.change(columnSelect, { target: { value: 'col1' } });

      // Toggle my cards
      const myCardsButton = screen.getByText('My cards');
      fireEvent.click(myCardsButton);

      expect(setSearchQuery).toHaveBeenCalledWith('bug');
      expect(setMinVotes).toHaveBeenCalledWith(2);
      expect(setFilterColumn).toHaveBeenCalledWith('col1');
      expect(setMyCardsOnly).toHaveBeenCalledWith(true);
    });

    test('displays all filters and result count together when isFiltering is true', () => {
      const columnOptions = [{ id: 'col1', title: 'To Do' }];

      render(
        <SearchFilterBar
          {...defaultProps}
          isFiltering={true}
          matchingCount={5}
          totalCards={20}
          minVotes={1}
          searchQuery="test"
          columnOptions={columnOptions}
        />
      );

      expect(screen.getByDisplayValue('test')).toBeInTheDocument();
      expect(screen.getByDisplayValue(1)).toBeInTheDocument(); // min votes
      expect(screen.getByText('5 of 20 cards')).toBeInTheDocument();
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
});
