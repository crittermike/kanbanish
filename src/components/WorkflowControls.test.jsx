import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import WorkflowControls from './WorkflowControls';

// Mock BoardContext
vi.mock('../context/BoardContext');

// Mock NotificationContext
const { mockShowNotification } = vi.hoisted(() => ({
  mockShowNotification: vi.fn()
}));
vi.mock('../context/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
    notification: { message: '', show: false }
  })
}));

// Mock react-feather
vi.mock('react-feather', () => ({
  Eye: () => <span>eye-icon</span>,
  MessageCircle: () => <span>message-icon</span>,
  Award: () => <span>award-icon</span>,
  ArrowLeft: () => <span>arrow-left-icon</span>,
  BarChart: () => <span>bar-chart-icon</span>,
  Heart: () => <span>heart-icon</span>
}));

// Mock VoteLimitModal
vi.mock('./modals/VoteLimitModal', () => ({
  default: ({ isOpen, onConfirm, onClose, currentLimit }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="vote-limit-modal">
        <span data-testid="current-limit">{currentLimit}</span>
        <button onClick={() => onConfirm(5)}>Confirm with 5</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  }
}));

describe('WorkflowControls', () => {
  const defaultContext = {
    workflowPhase: 'CREATION',
    initialWorkflowPhase: 'CREATION',
    votesPerUser: 3,
    startGroupingPhase: vi.fn(),
    startResultsPhase: vi.fn(),
    startPollPhase: vi.fn(),
    startPollResultsPhase: vi.fn(),
    goToPreviousPhase: vi.fn(),
    updateBoardSettings: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(defaultContext);
  });

  test('renders creation phase controls', () => {
    render(<WorkflowControls />);
    expect(screen.getByText('Card Creation Phase')).toBeInTheDocument();
    expect(screen.getByText('Reveal Cards & Start Grouping')).toBeInTheDocument();
  });

  test('hides Back to Health Check button when initialWorkflowPhase is CREATION', () => {
    render(<WorkflowControls />);
    expect(screen.queryByText('Back to Health Check')).not.toBeInTheDocument();
  });

  test('shows Back to Health Check button when initialWorkflowPhase is HEALTH_CHECK', () => {
    useBoardContext.mockReturnValue({
      ...defaultContext,
      initialWorkflowPhase: 'HEALTH_CHECK'
    });
    render(<WorkflowControls />);
    expect(screen.getByText('Back to Health Check')).toBeInTheDocument();
  });

  test('opens vote limit modal when starting voting from grouping phase', () => {
    useBoardContext.mockReturnValue({
      ...defaultContext,
      workflowPhase: 'GROUPING'
    });
    render(<WorkflowControls />);

    fireEvent.click(screen.getByText('Start Voting'));
    expect(screen.getByTestId('vote-limit-modal')).toBeInTheDocument();
  });

  test('vote limit modal receives current votesPerUser as currentLimit', () => {
    useBoardContext.mockReturnValue({
      ...defaultContext,
      workflowPhase: 'GROUPING',
      votesPerUser: 7
    });
    render(<WorkflowControls />);

    fireEvent.click(screen.getByText('Start Voting'));
    expect(screen.getByTestId('current-limit')).toHaveTextContent('7');
  });

  test('vote limit confirm sets votesPerUser and workflowPhase in a single updateBoardSettings call', () => {
    useBoardContext.mockReturnValue({
      ...defaultContext,
      workflowPhase: 'GROUPING'
    });
    render(<WorkflowControls />);

    // Open the modal
    fireEvent.click(screen.getByText('Start Voting'));
    // Confirm with 5 votes
    fireEvent.click(screen.getByText('Confirm with 5'));

    // Should make a single combined call, NOT two separate calls
    expect(defaultContext.updateBoardSettings).toHaveBeenCalledTimes(1);
    expect(defaultContext.updateBoardSettings).toHaveBeenCalledWith({
      votesPerUser: 5,
      workflowPhase: 'INTERACTIONS'
    });
  });

  test('vote limit confirm shows notification with vote count', () => {
    useBoardContext.mockReturnValue({
      ...defaultContext,
      workflowPhase: 'GROUPING'
    });
    render(<WorkflowControls />);

    fireEvent.click(screen.getByText('Start Voting'));
    fireEvent.click(screen.getByText('Confirm with 5'));

    expect(mockShowNotification).toHaveBeenCalledWith(
      'Voting phase started - each user can cast 5 votes'
    );
  });

  test('interactions phase shows View Results button', () => {
    useBoardContext.mockReturnValue({
      ...defaultContext,
      workflowPhase: 'INTERACTIONS'
    });
    render(<WorkflowControls />);
    expect(screen.getByText('View Results')).toBeInTheDocument();
  });

  test('clicking View Results calls startResultsPhase', () => {
    useBoardContext.mockReturnValue({
      ...defaultContext,
      workflowPhase: 'INTERACTIONS'
    });
    render(<WorkflowControls />);

    fireEvent.click(screen.getByText('View Results'));
    expect(defaultContext.startResultsPhase).toHaveBeenCalled();
  });
});
