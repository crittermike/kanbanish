import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CardHoverActions from './CardHoverActions';

describe('CardHoverActions', () => {
  const defaultProps = {
    showEmojiPicker: false,
    setShowEmojiPicker: vi.fn(),
    setShowComments: vi.fn(),
    toggleComments: vi.fn(),
    setEmojiPickerPosition: vi.fn(),
    emojiPickerPosition: { top: 0, left: 0 },
    addReaction: vi.fn(),
    hasUserReactedWithEmoji: vi.fn(() => false),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows edit, reaction, and comment buttons', () => {
    render(
      <CardHoverActions
        {...defaultProps}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Edit card')).toBeInTheDocument();
    expect(screen.getByLabelText('Add reaction')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle comments')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(
      <CardHoverActions
        {...defaultProps}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByLabelText('Edit card'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls toggleComments when comment button is clicked', () => {
    render(
      <CardHoverActions
        {...defaultProps}
        onEdit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Toggle comments'));
    expect(defaultProps.toggleComments).toHaveBeenCalledTimes(1);
  });

  it('hides reaction button when showEmojiAction is false', () => {
    render(
      <CardHoverActions
        {...defaultProps}
        showEmojiAction={false}
        onEdit={vi.fn()}
      />
    );

    expect(screen.queryByLabelText('Add reaction')).not.toBeInTheDocument();
  });
});
