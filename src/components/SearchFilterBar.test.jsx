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
});
