import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import Comments from './Comments';

vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

describe('Comments Cursor Behavior', () => {
  const mockAddComment = vi.fn();
  const mockEditComment = vi.fn();
  const mockDeleteComment = vi.fn();

  const baseProps = {
    onAddComment: mockAddComment,
    onEditComment: mockEditComment,
    onDeleteComment: mockDeleteComment,
    newComment: '',
    onCommentChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue({
      presenceData: {},
      showDisplayNames: true
    });
  });

  it('shows pointer cursor for editable comments (author)', () => {
    const comments = {
      comment1: {
        content: 'Test comment',
        timestamp: Date.now(),
        createdBy: 'user1'
      }
    };

    const isCommentAuthor = vi.fn().mockReturnValue(true);

    render(
      <Comments
        {...baseProps}
        comments={comments}
        isCommentAuthor={isCommentAuthor}
      />
    );

    const commentContent = screen.getByText('Test comment').closest('.comment-content');
    expect(commentContent).toHaveClass('editable');
    expect(commentContent).toHaveAttribute('title', 'Click to edit');
  });

  it('shows default cursor for non-editable comments (non-author)', () => {
    const comments = {
      comment1: {
        content: 'Test comment',
        timestamp: Date.now(),
        createdBy: 'user1'
      }
    };

    const isCommentAuthor = vi.fn().mockReturnValue(false);

    render(
      <Comments
        {...baseProps}
        comments={comments}
        isCommentAuthor={isCommentAuthor}
      />
    );

    const commentContent = screen.getByText('Test comment').closest('.comment-content');
    expect(commentContent).not.toHaveClass('editable');
    expect(commentContent).toHaveAttribute('title', 'Only the author can edit this comment');
  });
});
