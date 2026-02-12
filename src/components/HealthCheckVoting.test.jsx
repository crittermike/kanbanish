import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { useBoardContext } from '../context/BoardContext';
import HealthCheckVoting from './HealthCheckVoting';

// Mock the BoardContext
vi.mock('../context/BoardContext', () => ({
  useBoardContext: vi.fn()
}));

describe('HealthCheckVoting Component', () => {
  const mockSubmitHealthCheckVote = vi.fn();

  const HEALTH_CHECK_QUESTIONS = [
    { id: 'teamwork', label: 'Teamwork', description: 'How well is the team collaborating?' },
    { id: 'fun', label: 'Fun', description: 'How much fun are we having at work?' }
  ];

  const defaultMockContext = {
    userHealthCheckVotes: {},
    submitHealthCheckVote: mockSubmitHealthCheckVote,
    HEALTH_CHECK_QUESTIONS,
    activeUsers: 5,
    healthCheckVotes: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBoardContext.mockReturnValue(defaultMockContext);
  });

  test('renders all health check questions with labels and descriptions', () => {
    render(<HealthCheckVoting />);

    expect(screen.getByText('Teamwork')).toBeInTheDocument();
    expect(screen.getByText('How well is the team collaborating?')).toBeInTheDocument();
    expect(screen.getByText('Fun')).toBeInTheDocument();
    expect(screen.getByText('How much fun are we having at work?')).toBeInTheDocument();
  });

  test('calls submitHealthCheckVote with correct questionId and rating when clicking a rating button', () => {
    render(<HealthCheckVoting />);

    const teamworkQuestion = screen.getByTestId('health-check-question-teamwork');
    const ratingButtons = teamworkQuestion.querySelectorAll('.rating-button');
    
    // Click the 4th rating button
    fireEvent.click(ratingButtons[3]);

    expect(mockSubmitHealthCheckVote).toHaveBeenCalledWith('teamwork', 4);
  });

  test('shows completed status when all questions have been answered', () => {
    useBoardContext.mockReturnValue({
      ...defaultMockContext,
      userHealthCheckVotes: {
        teamwork: 4,
        fun: 3
      }
    });

    render(<HealthCheckVoting />);

    expect(screen.getByText('✓ You have rated all 2 areas. Ready to view results!')).toBeInTheDocument();
  });

  test('shows remaining count when not all questions are answered', () => {
    useBoardContext.mockReturnValue({
      ...defaultMockContext,
      userHealthCheckVotes: {
        teamwork: 4
      }
    });

    render(<HealthCheckVoting />);

    expect(screen.getByText('1 of 2 areas rated')).toBeInTheDocument();
  });

  test('shows voting progress section', () => {
    useBoardContext.mockReturnValue({
      ...defaultMockContext,
      activeUsers: 8,
      healthCheckVotes: {
        teamwork: { user1: 4, user2: 3 },
        fun: { user1: 5 }
      }
    });

    render(<HealthCheckVoting />);

    expect(screen.getByText('Participation')).toBeInTheDocument();
    expect(screen.getByText('2 of 8 participants have started (25%)')).toBeInTheDocument();
  });

  test('allows voting on multiple questions', () => {
    render(<HealthCheckVoting />);

    const teamworkQuestion = screen.getByTestId('health-check-question-teamwork');
    const funQuestion = screen.getByTestId('health-check-question-fun');
    
    const teamworkButtons = teamworkQuestion.querySelectorAll('.rating-button');
    const funButtons = funQuestion.querySelectorAll('.rating-button');
    
    fireEvent.click(teamworkButtons[4]); // Vote 5 on teamwork
    fireEvent.click(funButtons[2]); // Vote 3 on fun

    expect(mockSubmitHealthCheckVote).toHaveBeenCalledWith('teamwork', 5);
    expect(mockSubmitHealthCheckVote).toHaveBeenCalledWith('fun', 3);
  });

  test('allows changing vote on a question', () => {
    useBoardContext.mockReturnValue({
      ...defaultMockContext,
      userHealthCheckVotes: {
        teamwork: 3
      }
    });

    render(<HealthCheckVoting />);

    const teamworkQuestion = screen.getByTestId('health-check-question-teamwork');
    const ratingButtons = teamworkQuestion.querySelectorAll('.rating-button');
    
    // Change vote from 3 to 5
    fireEvent.click(ratingButtons[4]);

    expect(mockSubmitHealthCheckVote).toHaveBeenCalledWith('teamwork', 5);
  });

  test('displays rating labels on hover', () => {
    render(<HealthCheckVoting />);

    const teamworkQuestion = screen.getByTestId('health-check-question-teamwork');
    const ratingButtons = teamworkQuestion.querySelectorAll('.rating-button');
    
    // Hover over the 5th rating button
    fireEvent.mouseEnter(ratingButtons[4]);

    expect(screen.getByText('Great')).toBeInTheDocument();
  });

  test('displays check mark when question has been answered', () => {
    useBoardContext.mockReturnValue({
      ...defaultMockContext,
      userHealthCheckVotes: {
        teamwork: 4
      }
    });

    render(<HealthCheckVoting />);

    const teamworkQuestion = screen.getByTestId('health-check-question-teamwork');
    const checkMark = teamworkQuestion.querySelector('.vote-check');
    
    expect(checkMark).toBeInTheDocument();
    expect(checkMark).toHaveTextContent('✓');
  });

  test('shows 0% progress when no users have voted', () => {
    useBoardContext.mockReturnValue({
      ...defaultMockContext,
      activeUsers: 5,
      healthCheckVotes: {}
    });

    render(<HealthCheckVoting />);

    expect(screen.getByText('0 of 5 participants have started (0%)')).toBeInTheDocument();
  });

  test('shows 100% progress when all active users have voted', () => {
    useBoardContext.mockReturnValue({
      ...defaultMockContext,
      activeUsers: 3,
      healthCheckVotes: {
        teamwork: { user1: 4, user2: 3, user3: 5 },
        fun: { user1: 5, user2: 4, user3: 3 }
      }
    });

    render(<HealthCheckVoting />);

    expect(screen.getByText('3 of 3 participants have started (100%)')).toBeInTheDocument();
  });
});
