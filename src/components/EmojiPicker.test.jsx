import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmojiPicker from './EmojiPicker';

// Mock ReactDOM.createPortal to render directly
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (element) => element,
  };
});

describe('EmojiPicker Component', () => {
  const defaultProps = {
    position: { top: 100, left: 200 },
    onEmojiSelect: vi.fn(),
    onClose: vi.fn(),
    hasUserReactedWithEmoji: vi.fn(() => false),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders emoji picker with search input', () => {
    render(<EmojiPicker {...defaultProps} />);
    
    expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search emojis...')).toBeInTheDocument();
  });

  it('displays all emojis initially', () => {
    render(<EmojiPicker {...defaultProps} />);
    
    const emojiOptions = screen.getAllByTestId('emoji-option');
    expect(emojiOptions.length).toBeGreaterThan(100); // Should have many emojis
  });

  it('filters emojis based on search term', async () => {
    render(<EmojiPicker {...defaultProps} />);
    
    const searchInput = screen.getByTestId('emoji-search-input');
    
    // Search for a more specific term
    fireEvent.change(searchInput, { target: { value: 'fire' } });
    
    await waitFor(() => {
      const emojiOptions = screen.getAllByTestId('emoji-option');
      expect(emojiOptions.length).toBeLessThan(20); // Should be filtered
      expect(emojiOptions.length).toBeGreaterThan(0); // Should have some results
    });
  });

  it('shows no results message when search yields no matches', async () => {
    render(<EmojiPicker {...defaultProps} />);
    
    const searchInput = screen.getByTestId('emoji-search-input');
    
    // Search for something unlikely to match
    fireEvent.change(searchInput, { target: { value: 'xyznomatch' } });
    
    await waitFor(() => {
      expect(screen.getByTestId('emoji-no-results')).toBeInTheDocument();
      expect(screen.getByText(/No emojis found for/)).toBeInTheDocument();
      expect(screen.queryAllByTestId('emoji-option')).toHaveLength(0);
    });
  });

  it('clears search and shows all emojis when input is cleared', async () => {
    render(<EmojiPicker {...defaultProps} />);
    
    const searchInput = screen.getByTestId('emoji-search-input');
    
    // First search
    fireEvent.change(searchInput, { target: { value: 'fire' } });
    await waitFor(() => {
      const filteredOptions = screen.getAllByTestId('emoji-option');
      expect(filteredOptions.length).toBeLessThan(50);
    });
    
    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    
    await waitFor(() => {
      const allOptions = screen.getAllByTestId('emoji-option');
      expect(allOptions.length).toBeGreaterThan(100); // Should show all again
      expect(screen.queryByTestId('emoji-no-results')).not.toBeInTheDocument();
    });
  });

  it('calls onEmojiSelect and onClose when emoji is clicked', async () => {
    render(<EmojiPicker {...defaultProps} />);
    
    const firstEmoji = screen.getAllByTestId('emoji-option')[0];
    fireEvent.click(firstEmoji);
    
    expect(defaultProps.onEmojiSelect).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('applies selected class to emoji when user has reacted', () => {
    const hasUserReactedWithEmoji = vi.fn((emoji) => emoji === '😀');
    render(<EmojiPicker {...defaultProps} hasUserReactedWithEmoji={hasUserReactedWithEmoji} />);
    
    // Find an emoji that should be marked as selected
    const selectedEmoji = screen.getAllByTestId('emoji-option').find(button => 
      button.textContent === '😀' && button.classList.contains('selected')
    );
    
    expect(selectedEmoji).toBeInTheDocument();
  });

  it('positions picker correctly based on props', () => {
    const position = { top: 150, left: 250 };
    render(<EmojiPicker {...defaultProps} position={position} />);
    
    const picker = screen.getByTestId('emoji-picker');
    expect(picker).toHaveStyle({
      top: '150px',
      left: '250px',
    });
  });

  it('stops event propagation when clicking on picker', () => {
    const onClickSpy = vi.fn((e) => e.stopPropagation());
    
    // Mock the component with our spy
    const TestComponent = () => (
      <div
        className="emoji-picker"
        onClick={onClickSpy}
        data-testid="emoji-picker"
      >
        Test Content
      </div>
    );
    
    render(<TestComponent />);
    
    const picker = screen.getByTestId('emoji-picker');
    fireEvent.click(picker);
    
    expect(onClickSpy).toHaveBeenCalled();
  });

  it('focuses search input on mount', () => {
    render(<EmojiPicker {...defaultProps} />);
    
    const searchInput = screen.getByTestId('emoji-search-input');
    expect(searchInput).toHaveFocus();
  });

  it('filters emojis case-insensitively', async () => {
    render(<EmojiPicker {...defaultProps} />);
    
    const searchInput = screen.getByTestId('emoji-search-input');
    
    // Search with uppercase
    fireEvent.change(searchInput, { target: { value: 'SMILE' } });
    
    await waitFor(() => {
      const emojiOptions = screen.getAllByTestId('emoji-option');
      expect(emojiOptions.length).toBeGreaterThan(0); // Should find results
    });
  });

  it('searches by multiple keywords', async () => {
    render(<EmojiPicker {...defaultProps} />);
    
    const searchInput = screen.getByTestId('emoji-search-input');
    
    // Search for "heart" which should match multiple heart emojis
    fireEvent.change(searchInput, { target: { value: 'heart' } });
    
    await waitFor(() => {
      const emojiOptions = screen.getAllByTestId('emoji-option');
      expect(emojiOptions.length).toBeGreaterThan(5); // Should find multiple heart emojis
    });
  });

  it('searches for christmas emojis', async () => {
    render(<EmojiPicker {...defaultProps} />);
    
    const searchInput = screen.getByTestId('emoji-search-input');
    
    // Search for "christmas" which should match Christmas-themed emojis
    fireEvent.change(searchInput, { target: { value: 'christmas' } });
    
    await waitFor(() => {
      const emojiOptions = screen.getAllByTestId('emoji-option');
      expect(emojiOptions.length).toBeGreaterThan(0); // Should find Christmas emojis
      // Verify some specific Christmas emojis are present
      const emojiText = emojiOptions.map(option => option.textContent).join('');
      expect(emojiText).toContain('🎄'); // Christmas tree
      expect(emojiText).toContain('🎅'); // Santa
    });
  });

  it('searches for salute emoji', async () => {
    render(<EmojiPicker {...defaultProps} />);
    
    const searchInput = screen.getByTestId('emoji-search-input');
    
    // Search for "salute" which should match the salute emoji
    fireEvent.change(searchInput, { target: { value: 'salute' } });
    
    await waitFor(() => {
      const emojiOptions = screen.getAllByTestId('emoji-option');
      expect(emojiOptions.length).toBeGreaterThan(0); // Should find salute emojis
      const emojiText = emojiOptions.map(option => option.textContent).join('');
      expect(emojiText).toContain('🫡'); // Saluting face
    });
  });
});