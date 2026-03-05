import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import FocusMode from './FocusMode';

// Mock the BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: () => ({
    votingEnabled: true,
    user: { uid: 'test-user-123' }
  })
}));

// Mock MarkdownContent to simplify testing
vi.mock('./MarkdownContent', () => ({
  default: ({ content }) => <span data-testid="markdown-content">{content}</span>
}));

const baseProps = {
  isActive: true,
  currentIndex: 0,
  currentCard: {
    cardId: 'card1',
    cardData: {
      content: 'Test card content',
      votes: 3,
      reactions: {
        '👍': { count: 2, users: { 'test-user-123': true, 'other-user': true } },
        '❤️': { count: 1, users: { 'other-user': true } }
      },
      comments: { c1: { content: 'Nice!' }, c2: { content: 'Agreed' } },
      tags: ['bug', 'urgent'],
      color: '#ff5733'
    },
    columnId: 'col1',
    columnTitle: 'To Do',
    groupName: 'My Group'
  },
  totalCards: 5,
  goNext: vi.fn(),
  goPrev: vi.fn(),
  goToIndex: vi.fn(),
  exit: vi.fn(),
  autoPlayActive: false,
  toggleAutoPlay: vi.fn()
};

describe('FocusMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not active', () => {
    const { container } = render(<FocusMode {...baseProps} isActive={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no currentCard', () => {
    const { container } = render(<FocusMode {...baseProps} currentCard={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the overlay with correct ARIA attributes', () => {
    render(<FocusMode {...baseProps} />);
    const overlay = screen.getByRole('dialog');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute('aria-modal', 'true');
    expect(overlay).toHaveAttribute('aria-label', 'Focus mode — card presentation view');
  });

  it('displays card content via MarkdownContent', () => {
    render(<FocusMode {...baseProps} />);
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('Test card content');
  });

  it('displays column and group breadcrumb', () => {
    render(<FocusMode {...baseProps} />);
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('My Group')).toBeInTheDocument();
  });

  it('displays card counter (1/5)', () => {
    render(<FocusMode {...baseProps} />);
    const counter = document.querySelector('.focus-counter');
    expect(counter).toBeInTheDocument();
    expect(counter.querySelector('.focus-counter-current').textContent).toBe('1');
    expect(counter.querySelector('.focus-counter-total').textContent).toBe('5');
  });

  it('displays vote badge when votes > 0', () => {
    render(<FocusMode {...baseProps} />);
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('hides vote badge when votes are 0', () => {
    const card = {
      ...baseProps.currentCard,
      cardData: { ...baseProps.currentCard.cardData, votes: 0 }
    };
    render(<FocusMode {...baseProps} currentCard={card} />);
    expect(screen.queryByText('+0')).not.toBeInTheDocument();
  });

  it('displays tags', () => {
    render(<FocusMode {...baseProps} />);
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('displays reactions with counts', () => {
    render(<FocusMode {...baseProps} />);
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
  });

  it('displays comment count', () => {
    render(<FocusMode {...baseProps} />);
    expect(screen.getByText('💬 2 comments')).toBeInTheDocument();
  });

  it('shows singular "comment" for 1 comment', () => {
    const card = {
      ...baseProps.currentCard,
      cardData: { ...baseProps.currentCard.cardData, comments: { c1: { content: 'Only one' } } }
    };
    render(<FocusMode {...baseProps} currentCard={card} />);
    expect(screen.getByText('💬 1 comment')).toBeInTheDocument();
  });

  it('calls goNext when next button is clicked', () => {
    render(<FocusMode {...baseProps} />);
    fireEvent.click(screen.getByLabelText('Next card'));
    expect(baseProps.goNext).toHaveBeenCalledOnce();
  });

  it('calls goPrev when prev button is clicked', () => {
    render(<FocusMode {...baseProps} currentIndex={2} />);
    fireEvent.click(screen.getByLabelText('Previous card'));
    expect(baseProps.goPrev).toHaveBeenCalledOnce();
  });

  it('disables prev button on first card', () => {
    render(<FocusMode {...baseProps} currentIndex={0} />);
    expect(screen.getByLabelText('Previous card')).toBeDisabled();
  });

  it('disables next button on last card', () => {
    render(<FocusMode {...baseProps} currentIndex={4} totalCards={5} />);
    expect(screen.getByLabelText('Next card')).toBeDisabled();
  });

  it('calls exit when close button is clicked', () => {
    render(<FocusMode {...baseProps} />);
    fireEvent.click(screen.getByLabelText('Exit focus mode'));
    expect(baseProps.exit).toHaveBeenCalledOnce();
  });

  it('calls toggleAutoPlay when play button is clicked', () => {
    render(<FocusMode {...baseProps} />);
    fireEvent.click(screen.getByLabelText('Start auto-play'));
    expect(baseProps.toggleAutoPlay).toHaveBeenCalledOnce();
  });

  it('shows pause button when auto-play is active', () => {
    render(<FocusMode {...baseProps} autoPlayActive={true} />);
    expect(screen.getByLabelText('Pause auto-play')).toBeInTheDocument();
  });

  it('renders minimap dots for ≤40 cards', () => {
    render(<FocusMode {...baseProps} totalCards={5} />);
    const dots = screen.getAllByTitle(/Go to card/);
    expect(dots).toHaveLength(5);
  });

  it('calls goToIndex when minimap dot is clicked', () => {
    render(<FocusMode {...baseProps} totalCards={5} />);
    fireEvent.click(screen.getByTitle('Go to card 3'));
    expect(baseProps.goToIndex).toHaveBeenCalledWith(2);
  });

  it('renders keyboard hint', () => {
    render(<FocusMode {...baseProps} />);
    expect(screen.getByText(/← → navigate/)).toBeInTheDocument();
  });

  it('shows progress bar', () => {
    render(<FocusMode {...baseProps} currentIndex={2} totalCards={5} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '3');
    expect(progressBar).toHaveAttribute('aria-valuemax', '5');
  });

  it('applies color border when card has color', () => {
    render(<FocusMode {...baseProps} />);
    // The card element should have a border-top style
    const card = document.querySelector('.focus-card');
    expect(card.style.borderTop).toBe('4px solid #ff5733');
  });

  it('does not show group breadcrumb when card has no group', () => {
    const card = {
      ...baseProps.currentCard,
      groupName: undefined
    };
    render(<FocusMode {...baseProps} currentCard={card} />);
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.queryByText('My Group')).not.toBeInTheDocument();
  });
});
