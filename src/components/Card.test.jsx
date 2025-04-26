import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import Card from './Card';
import { useBoardContext } from '../context/BoardContext';
import { ref, set, remove } from 'firebase/database';
import { useDrag } from 'react-dnd';

// Mock modules
vi.mock('../utils/firebase', () => ({
  database: {}
}));
vi.mock('firebase/database');
vi.mock('react-dnd');
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (element) => element
}));
vi.mock('../context/BoardContext');

describe('Card Component', () => {
  const mockCardData = {
    content: 'Test card content',
    votes: 5,
    reactions: {
      '👍': {
        count: 2,
        users: {
          'user123': true
        }
      }
    },
    comments: {
      'comment1': {
        content: 'Test comment',
        user: 'user123'
      }
    }
  };

  const mockProps = {
    cardId: 'card123',
    cardData: mockCardData,
    columnId: 'column1',
    showNotification: vi.fn()
  };

  const mockBoardContext = {
    boardId: 'board123',
    user: { uid: 'user123' }
  };

  beforeEach(() => {
    vi.mocked(ref).mockReturnValue('mockedRef');
    vi.mocked(set).mockResolvedValue();
    vi.mocked(remove).mockResolvedValue();
    useBoardContext.mockReturnValue(mockBoardContext);
    vi.mocked(useDrag).mockReturnValue([{ isDragging: false }, vi.fn()]);
    window.confirm = vi.fn().mockImplementation(() => true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders card content correctly', () => {
    render(<Card {...mockProps} />);
    
    expect(screen.getByText('Test card content')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Votes count
  });

  test('renders emoji reactions', () => {
    render(<Card {...mockProps} />);
    
    const emojiReaction = screen.getByText('👍');
    expect(emojiReaction).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Emoji reaction count
  });

  test('allows editing card content', async () => {
    render(<Card {...mockProps} />);
    
    // Click the card to enter edit mode
    fireEvent.click(screen.getByText('Test card content'));
    
    // Check if textarea appears
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Test card content');
    
    // Edit the text
    fireEvent.change(textarea, { target: { value: 'Updated card content' } });
    expect(textarea).toHaveValue('Updated card content');
    
    // Save changes
    fireEvent.click(screen.getByText('Save'));
    
    // Wait for the async operations to complete
    await waitFor(() => {
      expect(ref).toHaveBeenCalled();
      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Card saved');
    });
  });

  test('shows comments when comments button is clicked', () => {
    render(<Card {...mockProps} />);
    
    // Find and click the comments button
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);
    
    // Check if comments section appears
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Test comment')).toBeInTheDocument();
  });

  test('allows adding upvotes', async () => {
    render(<Card {...mockProps} />);
    
    // Find and click the upvote button
    const upvoteButton = screen.getByTitle('Upvote');
    fireEvent.click(upvoteButton);
    
    // Wait for the async operations to complete
    await waitFor(() => {
      expect(ref).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('votes'));
      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Vote added');
    });
  });

  test('allows removing downvotes', async () => {
    render(<Card {...mockProps} />);
    
    // Find and click the downvote button
    const downvoteButton = screen.getByTitle('Downvote');
    fireEvent.click(downvoteButton);
    
    // Wait for the async operations to complete
    await waitFor(() => {
      expect(ref).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('votes'));
      expect(set).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Vote removed');
    });
  });

  test('allows deleting the card', async () => {
    render(<Card {...mockProps} />);
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Test card content'));
    
    // Click delete button
    fireEvent.click(screen.getByText('Delete'));
    
    // Wait for the async operations to complete
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(remove).toHaveBeenCalled();
      expect(mockProps.showNotification).toHaveBeenCalledWith('Card deleted');
    });
  });

  test('applies drag attributes to card element', () => {
    // Override the mock to simulate dragging
    useDrag.mockReturnValueOnce([{ isDragging: true }, vi.fn()]);
    
    render(<Card {...mockProps} />);
    
    // Check if the card div has the dragging class
    const cardElement = screen.getByText('Test card content').closest('.card');
    expect(cardElement).toHaveClass('dragging');
    expect(cardElement).toHaveStyle('opacity: 0.5');
  });

  test('stays in edit mode when clicking the textarea', () => {
    render(<Card {...mockProps} />);
    
    // Click the card to enter edit mode
    fireEvent.click(screen.getByText('Test card content'));
    
    // Get the textarea that appears in edit mode
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    
    // Click the textarea
    fireEvent.click(textarea);
    
    // Verify the textarea is still there (edit mode hasn't closed)
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveFocus();
  });

  test('allows adding comments with Enter key', async () => {
    render(<Card {...mockProps} />);
    
    // Open comments section
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);
    
    // Find and fill comment input
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(commentInput, { target: { value: 'New test comment' } });
    
    // Press Enter to submit
    fireEvent.keyPress(commentInput, {
      key: 'Enter',
      code: 'Enter',
      charCode: 13,
      keyCode: 13,
      which: 13,
      target: {
        value: 'New test comment'
      }
    });
    
    // Check if Firebase was called correctly
    await waitFor(() => {
      expect(ref).toHaveBeenCalled();
      const [database, path] = ref.mock.calls[0];
      expect(path).toMatch(/^boards\/board123\/columns\/column1\/cards\/card123\/comments\/\d+$/);
      
      expect(set).toHaveBeenCalledWith('mockedRef', {
        content: 'New test comment',
        user: 'user123'
      });
    });
    
    // Check if input was cleared
    expect(commentInput.value).toBe('');
  });

  test('does not add empty comments', async () => {
    render(<Card {...mockProps} />);
    
    // Open comments section
    const commentsButton = screen.getByTitle('Toggle comments');
    fireEvent.click(commentsButton);
    
    // Find comment input
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    
    // Try to submit empty comment
    fireEvent.keyPress(commentInput, {
      key: 'Enter',
      code: 'Enter',
      charCode: 13,
      keyCode: 13,
      which: 13,
      target: {
        value: ''
      }
    });
    
    // Check that Firebase was not called
    expect(ref).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });
});
