import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Comments from './Comments';

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

    const commentContent = screen.getByText('Test comment');
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

    const commentContent = screen.getByText('Test comment');
    expect(commentContent).not.toHaveClass('editable');
    expect(commentContent).toHaveAttribute('title', 'Only the author can edit this comment');
  });
});
