import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CardHoverActions from './CardHoverActions';

describe('CardHoverActions - Action Item Button Visibility', () => {
  const defaultProps = {
    showEmojiPicker: false,
    setShowEmojiPicker: vi.fn(),
    setShowComments: vi.fn(),
    toggleComments: vi.fn(),
    setEmojiPickerPosition: vi.fn(),
    emojiPickerPosition: { top: 0, left: 0 },
    addReaction: vi.fn(),
    hasUserReactedWithEmoji: vi.fn(() => false),
    commentCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows action item button when onConvertToActionItem is provided and hasActionItem is false', () => {
    render(
      <CardHoverActions
        {...defaultProps}
        onConvertToActionItem={vi.fn()}
        onRemoveActionItem={vi.fn()}
        hasActionItem={false}
        disabled={true}
        disabledReason="frozen"
      />
    );

    expect(screen.getByLabelText('Convert to action item')).toBeInTheDocument();
  });

  it('does not show action item button when hasActionItem is true', () => {
    render(
      <CardHoverActions
        {...defaultProps}
        onConvertToActionItem={vi.fn()}
        onRemoveActionItem={vi.fn()}
        hasActionItem={true}
      />
    );

    expect(screen.queryByLabelText('Convert to action item')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Remove action item')).toBeInTheDocument();
  });

  it('does not show action item button when onConvertToActionItem is not provided', () => {
    render(
      <CardHoverActions
        {...defaultProps}
        hasActionItem={false}
      />
    );

    expect(screen.queryByLabelText('Convert to action item')).not.toBeInTheDocument();
  });

  it('calls onConvertToActionItem when action item button is clicked', () => {
    const onConvertToActionItem = vi.fn();

    render(
      <CardHoverActions
        {...defaultProps}
        onConvertToActionItem={onConvertToActionItem}
        onRemoveActionItem={vi.fn()}
        hasActionItem={false}
      />
    );

    fireEvent.click(screen.getByLabelText('Convert to action item'));

    expect(onConvertToActionItem).toHaveBeenCalledTimes(1);
  });
});
