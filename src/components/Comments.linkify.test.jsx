import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import Comments from './Comments';

describe('Comments URL linking', () => {
  const mockProps = {
    comments: {
      '1': {
        content: 'Check out https://example.com for more info',
        timestamp: Date.now(),
        createdBy: 'user1'
      },
      '2': {
        content: 'Here are two links: http://first.com and https://second.com',
        timestamp: Date.now(),
        createdBy: 'user2'
      },
      '3': {
        content: 'Just plain text without any URLs',
        timestamp: Date.now(),
        createdBy: 'user3'
      }
    },
    onAddComment: vi.fn(),
    newComment: '',
    onCommentChange: vi.fn(),
    onEditComment: vi.fn(),
    onDeleteComment: vi.fn(),
    isCommentAuthor: vi.fn().mockReturnValue(false),
    interactionsDisabled: false,
    disabledReason: null
  };

  test('renders URLs as clickable links in comments', () => {
    render(<Comments {...mockProps} />);

    // Check for the first comment with a single URL
    const firstLink = screen.getByRole('link', { name: 'https://example.com' });
    expect(firstLink).toBeInTheDocument();
    expect(firstLink).toHaveAttribute('href', 'https://example.com');
    expect(firstLink).toHaveAttribute('target', '_blank');
    expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(firstLink).toHaveClass('auto-link');

    // Check for the second comment with multiple URLs
    const secondLink1 = screen.getByRole('link', { name: 'http://first.com' });
    expect(secondLink1).toBeInTheDocument();
    expect(secondLink1).toHaveAttribute('href', 'http://first.com');

    const secondLink2 = screen.getByRole('link', { name: 'https://second.com' });
    expect(secondLink2).toBeInTheDocument();
    expect(secondLink2).toHaveAttribute('href', 'https://second.com');

    // Check that plain text remains as text
    expect(screen.getByText('Just plain text without any URLs')).toBeInTheDocument();
    
    // Verify surrounding text is preserved
    expect(screen.getByText('Check out', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('for more info', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Here are two links:', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('and', { exact: false })).toBeInTheDocument();
  });

  test('links work correctly with different URL formats', () => {
    const propsWithVariousUrls = {
      ...mockProps,
      comments: {
        '1': {
          content: 'Visit https://www.example.com/path?param=value&other=123#section',
          timestamp: Date.now(),
          createdBy: 'user1'
        }
      }
    };

    render(<Comments {...propsWithVariousUrls} />);

    const link = screen.getByRole('link', { name: 'https://www.example.com/path?param=value&other=123#section' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://www.example.com/path?param=value&other=123#section');
  });
});